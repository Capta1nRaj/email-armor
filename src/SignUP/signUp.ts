import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../../models/otpModel.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";
import fetchUserIP from "../utils/fetchUserIP.js"

const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS && process.env.ALLOWED_EMAIL_DOMAINS.split(',');

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

async function signup(userFullName: string, userName: string, userEmail: string, userPassword: string, userReferredBy: string, userAgent: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) {
        return {
            status: 401,
            message: "Your device is unauthorized."
        };
    }

    try {

        // Checking If userFullName Is Valid Or Not
        const regexForuserFullName = /^[a-zA-Z\s]+$/;

        if (!regexForuserFullName.test(userFullName)) {
            return { status: 400, message: "Invalid userFullname" };
        }

        // Checking If userName Is Valid Or Not
        const regexForuserName = /^[a-zA-Z0-9_]+$/;

        if (!regexForuserName.test(userName)) {
            return { status: 400, message: "Invalid userName" };
        }

        // Checking If Email Includes 2 @ Signs
        const regexForuserEmail = /^[a-zA-Z0-9._@]+$/;

        if (userEmail.toLowerCase().includes('@', userEmail.toLowerCase().indexOf('@') + 1) || !regexForuserEmail.test(userEmail)) {
            return { status: 400, message: "Invalid Email Buddy!" };
        }

        // Checking If Email Domain Is Allowed Or Not
        if (Array.isArray(allowedDomains) && !allowedDomains.some((domain: string) => userEmail.toLowerCase().endsWith(domain))) {
            return { status: 400, message: "Email Isn't From The Allowed Domains From The List." };
        }

        // If User Passowrd Length Is Lesser Than 8, Throw An Error
        if (userPassword.length <= 8) {
            return {
                status: 206,
                message: "Min. Password Length Must Be Greater Than 8",
            };
        }

        await connect2MongoDB();

        // Checking If UserName & EmailId Already Exists In DB Or Not
        const existingUser = await accountsModel.findOne({ $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }] }).select('userName userEmail');

        // If User Exist, Notify The Client With The Following Message Depending On The Case
        if (existingUser) {
            let message = "";
            if (existingUser.userName === userName.toLowerCase()) {
                message += "Username already exists.";
                return { status: 400, message };
            }
            if (existingUser.userEmail === userEmail.toLowerCase()) {
                message += "Email ID already exists.";
                return { status: 400, message };
            }
        }

        // Checking If User Entered A Referral Code Or Not
        // If Entered, Check That It Exist Or Not
        // If Not Entered, Set As ''
        const referredByUser = userReferredBy.length > 0 ? await accountsModel.findOne({ userReferralCode: userReferredBy }).select('userName') : '';

        // If User Entered Wrong Referral Code, Return The Error
        if (referredByUser === null) {
            return { status: 200, message: "Wrong Referral Code" };
        }

        // Generating A Unique userReferralCode For The New User
        const userReferralCode = await generatingUserReferralCode();

        // Secure user password
        const encryptedPassword = await bcrypt.hash(userPassword, saltRounds)

        // Save New User Details To DB
        new accountsModel({
            userFullName,
            userName: userName.toLowerCase(),
            userEmail: userEmail.toLowerCase(),
            userPassword: encryptedPassword,
            userReferralCode: userReferralCode,
            userReferredBy: referredByUser.userName || "",
        }).save().then();

        // Generate And Securing an OTP
        const userOTP = await randomStringGenerator(6);
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds)

        // Fetching User IP
        const userIP = await fetchUserIP();

        // Send Un-Secured OTP To The User Registered E-Mail
        sendOTPToUser(userName.toLowerCase(), userEmail.toLowerCase(), userOTP, 'signUp', userIP, userAgent);

        // Saving Secured OTP to DB
        new otpModel({ userName: userName.toLowerCase(), OTP: encryptedOTP }).save().then();

        return { status: 201, message: "Account Created Successfully", userName: userName.toLowerCase() };

    } catch (error) {
        return { status: 500, message: "Internal Server Error" };
    }
}

// Generating Unique Referral Code For New User
async function generatingUserReferralCode() {
    // Random 6 Digit Generation
    const userReferralCode = await randomStringGenerator(6);

    // Check If Code Already Exist In DB Or Not
    const existingCode = await accountsModel.exists({ userReferralCode });

    // If Referral Code Exists, Regenerate New Code
    if (existingCode) {
        return generatingUserReferralCode();
    }
    return userReferralCode;
}

export default signup;