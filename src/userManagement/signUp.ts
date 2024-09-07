// Basic imports
import userAccountsModel from '../../models/userAccountsModel.js';
import settingsModel from '../../models/settingsModel.js';
import referHistoryModel from '../../models/referHistoryModel.js';
import sessionsModel from '../../models/sessionsModel.js';
import { connect2MongoDB } from "connect2mongodb";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();

// Checking if BCRYPT_SALT_ROUNDS is a number
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

// Retrieving jwt environment variables
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined || value.length === 0) { throw new Error(`${key} is undefined.`); }
    return value;
}
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');
let expireJwtToken: string | null = getEnvVariable('EXPIRE_JWT_TOKEN');
if (expireJwtToken === '0') { expireJwtToken = null }

async function signUp(userFullName: string, userName: string, userEmail: string, userPassword: string, userReferredBy: string, userAgent: string, userRole: string) {
    // Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) { return { message: "Your device is unauthorized.", status: 401 }; }

    try {

        // Validating userFullName format
        const regexForuserFullName = /^[a-zA-Z\s]+$/;
        if (!regexForuserFullName.test(userFullName)) { return { message: "Invalid Fullname!", status: 400, }; }

        // Validating userName format
        const regexForuserName = /^[a-zA-Z0-9_]+$/;
        if (!regexForuserName.test(userName)) { return { message: "Invalid username!", status: 400, }; }

        // Validating userEmail address format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) { return { message: "Invalid Email!", status: 400 }; }

        // If User Passowrd Length Is Lesser Than 8, Throw An Error
        if (userPassword.length <= 8) { return { message: "Min. Password Length Must Be Greater Than 8.", status: 206 }; }

        // Connecting to MongoDB
        await connect2MongoDB();

        // Validating if userName & emailId already exists
        const existingUser = await userAccountsModel.findOne({ $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }] }).select('userName userEmail');

        // If user exist, notify client with the following message as per the case
        if (existingUser) {
            let message = "";
            if (existingUser.userName === userName.toLowerCase()) { message += "Username already exists!"; return { message, status: 400 }; }
            if (existingUser.userEmail === userEmail.toLowerCase()) { message += "Email already exists!"; return { message, status: 400 }; }
        }

        // Vaalidting referral code if porvided
        // If no referral code, set as null
        const referredByUser = userReferredBy.length > 0 ? await userAccountsModel.findOne({ userReferralCode: userReferredBy }).select('_id') : '';

        // If invalid referral code, throw error
        if (referredByUser === null) { return { message: "Wrong Referral Code!", status: 400 }; }

        // Generateing unique referral code
        const userReferralCode = await generatingUserReferralCode();

        // Hasing user password
        const hashingPassword = await bcrypt.hash(userPassword, saltRounds);

        // Fetching the referring points values
        const fetchSettings = await settingsModel.findOne({}).select('referred_person_points referred_points');

        // Save New User Details To DB
        const newUserID = await new userAccountsModel({
            userFullName,
            userName: userName.toLowerCase(),
            userEmail: userEmail.toLowerCase(),
            userPassword: hashingPassword,
            userReferralCode: userReferralCode,
            userReferredBy: referredByUser ? referredByUser._id : null,
            points: referredByUser ? fetchSettings.referred_person_points : 0,
            userRole: userRole || ""
        }).save();

        // If user is referred by someone, then, give the points to the user who referred him
        if (newUserID.userReferredBy) {
            //!  Referral guy
            const guyWhoReferred = await userAccountsModel.findOneAndUpdate(
                { _id: newUserID.userReferredBy },
                { $addToSet: { userReferrals: newUserID._id }, $inc: { points: fetchSettings.referred_points } },
                { new: true }
            ).select('userName');

            //! Adding the referred points history in the DB for future use if needed by the organization
            const referHistoryData = [
                { userName: guyWhoReferred._id, points: fetchSettings.referred_points, reason: "Referred to " + userName.toLowerCase() + "." },
                { userName: newUserID._id, points: fetchSettings.referred_person_points, reason: "Referred by " + guyWhoReferred.userName + "." }
            ];
            await referHistoryModel.insertMany(referHistoryData);
        }

        // Hasing userAgent
        const hashingUserAgent = await bcrypt.hash(userAgent, saltRounds)

        // JWT Token data
        const jwtData = { userName: userName.toLowerCase(), userAgent: hashingUserAgent }

        // Signing JWT Token with jwtTokenValue & expiry date
        const signOptions = expireJwtToken ? { expiresIn: expireJwtToken } : undefined;
        const signedJWTToken = jwt.sign(jwtData, jwtTokenValue, signOptions);

        // Encrypting jwtToken
        const hashingJWTToken = await bcrypt.hash(signedJWTToken, saltRounds)

        // Storing the session model in the DB with an expiration set to 1 year from now
        const sessionID = await new sessionsModel({
            userName: newUserID._id,
            userAgent: userAgent,
            jwtToken: hashingJWTToken,
            expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }).save();

        return { id: sessionID._id, userName: userName.toLowerCase(), signedJWTToken: signedJWTToken, message: "Account Created Successfully!", status: 202 };

    } catch (error) {
        console.error(error)
        // Returning a message with a link to raise a PR on GitHub in case of a server error
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

// Generating Unique Referral Code For New User
async function generatingUserReferralCode() {
    // Generating a random 6-digit OTP
    const userReferralCode = await randomStringGenerator(6);

    // Check If Code Already Exist In DB Or Not
    const existingCode = await userAccountsModel.exists({ userReferralCode });

    // If Referral Code Exists, Regenerate New Code
    if (existingCode) { return generatingUserReferralCode(); }
    return userReferralCode;
}

export default signUp;