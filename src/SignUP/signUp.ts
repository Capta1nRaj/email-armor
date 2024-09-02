// Basic imports
import userAccountsModel from '../../models/userAccountsModel.js';
import settingsModel from '../../models/settingsModel.js';
import referHistoryModel from '../../models/referHistoryModel.js';
import sessionsModel from '../../models/sessionsModel.js';
import { connect2MongoDB } from "connect2mongodb";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import { config } from 'dotenv';
config();

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

// Retrieving jwt environment variables
import jwt from 'jsonwebtoken';
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined || value.length === 0) { throw new Error(`${key} is undefined.`); }
    return value;
}
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');
let expireJwtToken: string | null = getEnvVariable('EXPIRE_JWT_TOKEN');
if (expireJwtToken === '0') { expireJwtToken = null }

async function signup(userFullName: string, userName: string, userEmail: string, userPassword: string, userReferredBy: string, userAgent: string, userRole: string) {

    //! Checking if user is trying to hit the API with a software like Postman
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

        // Validating if UserName & EmailId Already Exists In DB Or Not
        const existingUser = await userAccountsModel.findOne({ $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }] }).select('userName userEmail');

        // If User Exist, Notify The Client With The Following Message Depending On The Case
        if (existingUser) {
            let message = "";
            if (existingUser.userName === userName.toLowerCase()) { message += "Username already exists!"; return { message, status: 400 }; }
            if (existingUser.userEmail === userEmail.toLowerCase()) { message += "Email already exists!"; return { message, status: 400 }; }
        }

        // Checking If User Entered A Referral Code Or Not
        // If Entered, Check That It Exist Or Not
        // If Not Entered, Set As ''
        const referredByUser = userReferredBy.length > 0 ? await userAccountsModel.findOne({ userReferralCode: userReferredBy }).select('_id') : '';

        // If User Entered Wrong Referral Code, Return The Error
        if (referredByUser === null) { return { message: "Wrong Referral Code!", status: 400 }; }

        // Generating A Unique userReferralCode For The New User
        const userReferralCode = await generatingUserReferralCode();

        // Hasing user password
        const hashingPassword = await bcrypt.hash(userPassword, saltRounds);

        // Save New User Details To DB
        const newUserID = await new userAccountsModel({
            userFullName,
            userName: userName.toLowerCase(),
            userEmail: userEmail.toLowerCase(),
            userPassword: hashingPassword,
            userReferralCode: userReferralCode,
            userReferredBy: referredByUser ? referredByUser._id : null,
            userRole: userRole || ""
        }).save();

        // If User Is Referred By Someone
        if (newUserID.userReferredBy) {
            // It Will Fetch Settings, & Get The Points Values From The DB
            const fetchSettings = await settingsModel.findOne({}).select('referred_person_points referred_points');

            // First, It Will Verify The User's Account And Assign Them The Referral Points (REFERRED_PERSON_POINTS as per JSON File)
            //! Guy got referred 
            await userAccountsModel.updateOne({ userName: userName.toLowerCase() }, { $inc: { points: fetchSettings.referred_person_points } });

            // Secondly, It Will Update The Points For The User (REFERRED_POINTS As Per JSON File) Who Referred Them And Add The User's userName To The Referrer's List
            // It Will User The Referral Code To Find The User Who Referred A New User
            //!  Guy who referred
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
        const jwtData = {
            userName: userName.toLowerCase(),
            userAgent: hashingUserAgent
        }

        // Signing JWT Token with jwtTokenValue & expiry date
        const signOptions = expireJwtToken ? { expiresIn: expireJwtToken } : undefined;
        const signedJWTToken = jwt.sign(jwtData, jwtTokenValue, signOptions);

        // Encrypting jwtToken
        const hashingJWTToken = await bcrypt.hash(signedJWTToken, saltRounds)

        // Store a session model to DB, & it will expire after 1 year
        const sessionID = await new sessionsModel({
            userName: newUserID._id,
            userAgent: userAgent,
            jwtToken: hashingJWTToken,
            expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }).save();

        return { id: sessionID._id, userName: userName.toLowerCase(), signedJWTToken: signedJWTToken, message: "Account Created Successfully!", status: 202 };

    } catch (error) {
        console.log(error)
        return { status: 500, message: "Internal Server Error!" };
    }
}

// Generating Unique Referral Code For New User
async function generatingUserReferralCode() {
    // Random 6 Digit Generation
    const userReferralCode = await randomStringGenerator(6);

    // Check If Code Already Exist In DB Or Not
    const existingCode = await userAccountsModel.exists({ userReferralCode });

    // If Referral Code Exists, Regenerate New Code
    if (existingCode) { return generatingUserReferralCode(); }
    return userReferralCode;
}

export default signup;