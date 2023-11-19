import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import otpModel from "../../models/otpModel.js";

import sendOTPToUser from "./sendOTPToUser.js";
import fetchUserIP from "./fetchUserIP.js";
import randomStringGenerator from "./randomStringGenerator.js";
import encryptPassword from "../PasswordHashing/encryptPassword.js";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import settingsModel from "../../models/settingsModel.js";

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

async function resendOTP(username: string, functionPerformed: string, token: string, id: string, userAgent: string) {

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
    const fetchSettings = await settingsModel.findOne({})

    // Fetching userIP
    const userIP = await fetchUserIP();

    // If New User Verification Needs To Be Done, Run This Function
    if (functionPerformed === 'newUserVerification') {

        // Checking If User Exist In DB Or Not
        const findIfUserNameExistBeforeSending = await otpModel.findOne({ userName });

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
        const encryptOTP = await encryptPassword(userOTP);

        // Updating User OTP Count And OTP
        await otpModel.findOneAndUpdate({ userName }, { OTP: encryptOTP, $inc: { OTPCount: 1 } });

        // Finding The User Email Via userName In The DB
        const findUserAndSendEmail = await accountsModel.findOne({ userName });

        // Sending OTP To User
        await sendOTPToUser(userName, findUserAndSendEmail?.userEmail, userOTP, 'signUp', userIP, userAgent);

        return {
            status: 201,
            message: "OTP Resent To The User.",
        };

        // If Old User Verification Needs To Be Done, Then, Run This Function
    } else if (functionPerformed === 'oldUserVerification') {

        try {

            // Finding If User Session Exist In DB Or Not
            const findUserSessionViaID = await sessionsModel.findById(id)

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

            // Decrypting User IP
            const userIPDecrypted = await decryptPassword(findUserSessionViaID.userIP);

            if (findUserSessionViaID.userName === userName && findUserSessionViaID.token === token && userIP === userIPDecrypted) {

                // Generating userOTP Of Length 6
                const userOTP = await randomStringGenerator(6);

                // Ecnrytpiong The OTP
                const encryptOTP = await encryptPassword(userOTP);

                // Updating Secured OTP TO DB
                findUserSessionViaID.OTP = encryptOTP;

                // Incrementing OTP Count To DB
                findUserSessionViaID.OTPCount++;

                // Updating The DB With New Details
                await findUserSessionViaID.save();

                // Finding The Email Of The User
                const findUserAndSendEmail = await accountsModel.findOne({ userName });

                // Sending The OTP To The User
                await sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'signIn', userIP, userAgent);

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
        const findIfUserNameExistBeforeSending = await otpModel.findOne({ userName });

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
        const encryptOTP = await encryptPassword(userOTP);

        // Updating Secured OTP TO DB
        findIfUserNameExistBeforeSending.OTP = encryptOTP;

        // Incrementing OTP Count To DB
        findIfUserNameExistBeforeSending.OTPCount++;

        // Updating The DB With New Details
        await findIfUserNameExistBeforeSending.save();

        // Finding userEmail Via userName
        const findUserAndSendEmail = await accountsModel.findOne({ userName });

        // Sending OTP To User
        await sendOTPToUser(userName, findUserAndSendEmail?.userEmail, userOTP, 'forgotPassword', userIP, userAgent);

        return {
            status: 201,
            message: "OTP Resent To The User.",
        };

    }
}

export default resendOTP;