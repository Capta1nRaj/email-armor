import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import otpModel from '../../models/otpModel.js';
import settingsModel from '../../models/settingsModel.js';
import referHistoryModel from '../../models/referHistoryModel.js';

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

//! Checking if JWT_TOKEN_VALUE is a defined or not
//! Checking if EXPIRE_JWT_TOKEN value is a defined or not
import jwt from 'jsonwebtoken';
import sessionsModel from '../../models/sessionsModel.js';
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined || value.length === 0) {
        throw new Error(`${key} is undefined.`);
    }
    return value;
}

// Retrieve environment variables
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');
let expireJwtToken: string | null = getEnvVariable('EXPIRE_JWT_TOKEN');
if (expireJwtToken === '0') { expireJwtToken = null }
async function signUpVerify(username: string, otp: string, userAgent: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

    try {

        await connect2MongoDB();

        // Firstly, It Will Find If User Exist In otpModel Or Not
        const getUserDetailsAndOTP = await otpModel.findOne({ userName: username.toLowerCase() }).select('userName OTP');

        // If No Document's With The Given userName Exist In DB, Return 400 Status Code
        if (!getUserDetailsAndOTP) { return { status: 400, message: "No Accounts Were Found To Verify", }; }

        // Decrypting The OTP From The User
        const decryptedOTP = await bcrypt.compare(otp, getUserDetailsAndOTP.OTP);

        // If User Enters Wrong OTP
        if (decryptedOTP === false) { return { status: 400, message: "Wrong OTP", }; }

        // Delete The OTP From otpModel Collection
        await otpModel.deleteOne({ userName: username.toLowerCase() });

        //! If User Enters Correct OTP
        // It Will Find The New User's username, And As Per The Document, If The User Entered The Correct Referral Code, They Will Receive (Referred_points As Per The Json File) Points From The Referrer And Get Added To The Referrer's List With Their Name.
        // The Referrer Gets (Referred_person_points As Per The Json File) Points. 
        // If The User Didn't Enter Any Referral Code, Then They Will Not Get Any Points.
        const referredUserData = await accountsModel.findOne({ userName: getUserDetailsAndOTP.userName }).select('userName userReferredBy');

        // If User Is Referred By None
        if (!referredUserData.userReferredBy) {

            // It Will Simply Verify The User's Account.
            await accountsModel.updateOne({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: 0 } }, { new: true });

            // If User Is Referred By Someone
        } else {

            // It Will Fetch Settings, & Get The Points Values From The DB
            const fetchSettings = await settingsModel.findOne({}).select('referred_person_points referred_points');

            // First, It Will Verify The User's Account And Assign Them The Referral Points (REFERRED_PERSON_POINTS as per JSON File)
            //! Guy got referred 
            await accountsModel.updateOne({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: fetchSettings.referred_person_points } }, { new: true });

            // Secondly, It Will Update The Points For The User (REFERRED_POINTS As Per JSON File) Who Referred Them And Add The User's userName To The Referrer's List
            // It Will User The Referral Code To Find The User Who Referred A New User
            //!  Guy who referred
            const referralUserData = await accountsModel.findOneAndUpdate(
                { userName: referredUserData.userReferredBy },
                { $addToSet: { userReferrals: referredUserData.userName }, $inc: { points: fetchSettings.referred_points } },
                { new: true }
            ).select('userName');

            //! Adding the referred points history in the DB for future use if needed by the organization
            const referHistoryData = [
                { userName: referralUserData._id, points: fetchSettings.referred_points, reason: "Referred to " + username.toLowerCase() + "." },
                { userName: referredUserData._id, points: fetchSettings.referred_person_points, reason: "Referred by " + referralUserData.userName + "." }
            ];
            await referHistoryModel.insertMany(referHistoryData);
        }

        // Encrypting userAgent
        const encryptedUserAgent = await bcrypt.hash(userAgent, saltRounds)

        // JWT Token data
        const jwtData = {
            userName: username,
            userAgent: encryptedUserAgent
        }

        // Signing JWT Token with jwtTokenValue & expiry date
        const signOptions = expireJwtToken ? { expiresIn: expireJwtToken } : undefined;
        const signedJWTToken = jwt.sign(jwtData, jwtTokenValue, signOptions);

        // Encrypting jwtToken
        const encryptedJWTToken = await bcrypt.hash(signedJWTToken, saltRounds)

        // Store a session model to DB, & it will expire after 1 year
        const sessionToken = await new sessionsModel({
            userName: username,
            userAgent: userAgent,
            jwtToken: encryptedJWTToken,
            expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }).save();

        return { id: sessionToken._id, userName: sessionToken.userName.toLowerCase(), signedJWTToken, status: 202, message: "Account Verified" }

    } catch (error) {
        console.log(error)
        return { status: 500, message: "Internal Server Error" };
    }
}

export default signUpVerify;