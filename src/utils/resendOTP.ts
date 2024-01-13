import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import otpModel from "../../models/otpModel.js";

import sendOTPToUser from "./sendOTPToUser.js";
import fetchUserIP from "./fetchUserIP.js";
import randomStringGenerator from "./randomStringGenerator.js";
import settingsModel from "../../models/settingsModel.js";

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

async function resendOTP(username: string, functionPerformed: string, userAgent: string, id: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) {
        return {
            status: 401,
            message: "Your device is unauthorized."
        };
    }

    const userName = username.toLowerCase();

    await connect2MongoDB();

    // Generating userOTP Of Length 6
    const userOTP = await randomStringGenerator(6);

    // It Will Fetch Settings, & Get The OTP Limits Values From The DB
    const fetchSettings = await settingsModel.findOne({}).select('otp_limits');

    // Fetching userIP
    const userIP = await fetchUserIP();

    // If New User Verification Needs To Be Done, Run This Function
    if (functionPerformed === 'newUserVerification') {

        // Checking If User Exist In DB Or Not
        const findIfUserNameExistBeforeSending = await otpModel.findOne({ userName }).select('OTPCount');

        // If Not, Means Someone Is Trying To Uh....
        if (!findIfUserNameExistBeforeSending) {
            return {
                status: 401,
                message: "Is this Mr. Developer or someone trying to.... uh?",
            };
        }

        // If User Exist, Then, We Will Try To Check That How Many Times Did User Reguested For OTP
        // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes

        if (findIfUserNameExistBeforeSending.OTPCount >= fetchSettings.otp_limits) {
            return {
                status: 403,
                message: "Max OTP Limit Reached, Please Try After 10 Minutes."
            };
        }

        // Encrypting The User OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

        // Updating User OTP Count And OTP
        otpModel.updateOne({ userName }, { OTP: encryptedOTP, $inc: { OTPCount: 1 } }).then();

        // Finding The User Email Via userName In The DB
        const findUserAndSendEmail = await accountsModel.findOne({ userName }).select('userEmail');

        // Sending OTP To User
        sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'signUp', userIP, userAgent);

        return {
            status: 201,
            message: "OTP Resent To The User.",
        };

        // If Old User Verification Needs To Be Done, Then, Run This Function
    } else if (functionPerformed === 'oldUserVerification') {

        try {

            // Finding If User Session Exist In DB Or Not
            const findUserSessionViaID = await sessionsModel.findById(id).select('userName OTPCount');

            // If Not, Means Someone Is Trying To Uh....
            if (findUserSessionViaID === null) {
                return {
                    status: 401,
                    message: "Is this Mr. Developer or someone trying to.... uh?"
                }
            }

            // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes
            if (findUserSessionViaID.OTPCount >= fetchSettings.otp_limits) {
                return {
                    status: 403,
                    message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                };
            }

            if (findUserSessionViaID.userName === userName) {

                // Generating userOTP Of Length 6
                const userOTP = await randomStringGenerator(6);

                // Ecnrytpiong The OTP
                const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

                // Updating Secured OTP TO DB
                findUserSessionViaID.OTP = encryptedOTP;

                // Incrementing OTP Count To DB
                findUserSessionViaID.OTPCount++;

                // Updating The DB With New Details
                findUserSessionViaID.save().then();

                // Finding The Email Of The User
                const findUserAndSendEmail = await accountsModel.findOne({ userName }).select('userEmail');

                // Sending The OTP To The User
                sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'signIn', userIP, userAgent).then();

                return {
                    status: 201,
                    message: "OTP Resent To The User.",
                };

            } else {

                return {
                    status: 401,
                    message: "Is this Mr. Developer or someone trying to.... uh?",
                };

            }

        } catch (error) {

            return {
                status: 401,
                message: "Is this Mr. Developer or someone trying to.... uh?",
            };

        }

        // If User Needs To Reset The Password, Then, Run This Function
    } else if (functionPerformed === 'forgotPassword') {

        // Finding If User Exist In DB Or Not
        const findIfUserNameExistBeforeSending = await otpModel.findOne({ userName }).select('OTPCount');

        // If Not, Means Someone Is Trying To Uh....
        if (findIfUserNameExistBeforeSending === null) {
            return {
                status: 401,
                message: "Is this Mr. Developer or someone trying to.... uh?",
            };
        }

        // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes
        if (findIfUserNameExistBeforeSending.OTPCount >= fetchSettings.otp_limits) {

            return {
                status: 403,
                message: "Max OTP Limit Reached, Please Try After 10 Minutes."
            };

        }

        // Encrypting The OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

        // Updating Secured OTP TO DB
        findIfUserNameExistBeforeSending.OTP = encryptedOTP;

        // Incrementing OTP Count To DB
        findIfUserNameExistBeforeSending.OTPCount++;

        // Updating The DB With New Details
        findIfUserNameExistBeforeSending.save().then();

        // Finding userEmail Via userName
        const findUserAndSendEmail = await accountsModel.findOne({ userName }).select('userEmail');

        // Sending OTP To User
        sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'forgotPassword', userIP, userAgent).then();

        return {
            status: 201,
            message: "OTP Resent To The User.",
        };

    }
}

export default resendOTP;