import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import otpModel from "../../models/otpModel.js";

import sendOTPToUser from "../utils/sendOTPToUser.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import settingsModel from "../../models/settingsModel.js";

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
import userAccountsModel from '../../models/userAccountsModel.js';
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

async function resendOTP(username: string, functionPerformed: string, userAgent: string, id: string, userIP: string) {

    // Checking if user is trying to hit the API with a software like Postman
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

    // If New User Verification Needs To Be Done, Run This Function
    if (functionPerformed === 'newUserVerification') {

        // Checking If User Exist In DB Or Not
        const findIfUserNameExistBeforeSending = await otpModel.findOne({ userName }).select('OTPCount');

        // If Not, Means Someone Is Trying To Uh or the OTP expired
        if (!findIfUserNameExistBeforeSending) {
            // Checking if user is verified or not, if no, then, it means the OTP is expired, so we will resend the OTP
            const checkIsUserVerified = await userAccountsModel.findOne({ userName }).select('userEmail userVerified');

            if (checkIsUserVerified.userVerified) {

                return { status: 401, message: "Session Expired!", };

            } else {
                // Encrypting The User OTP
                const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

                // Saving Secured OTP to DB
                await new otpModel({ userName: userName.toLowerCase(), OTP: encryptedOTP }).save();

                // Sending OTP To User
                await sendOTPToUser(userName, checkIsUserVerified.userEmail, userOTP, 'signUp', userIP, userAgent);

                return { status: 201, message: "OTP Resent To The User.", };
            }
        }

        // If User Exist, Then, We Will Try To Check That How Many Times Did User Reguested For OTP
        // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes

        if (findIfUserNameExistBeforeSending.OTPCount >= fetchSettings.otp_limits) {
            return { status: 403, message: "Max OTP Limit Reached, Please Try After 10 Minutes." };
        }

        // Encrypting The User OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

        // Updating User OTP Count And OTP
        await otpModel.updateOne({ userName }, { OTP: encryptedOTP, $inc: { OTPCount: 1 } });

        // Finding The User Email Via userName In The DB
        const findUserAndSendEmail = await userAccountsModel.findOne({ userName }).select('userEmail');

        // Sending OTP To User
        await sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'signUp', userIP, userAgent);

        return {
            status: 201,
            message: "OTP Resent To The User.",
        };

        // If Old User Verification Needs To Be Done, Then, Run This Function
    } else if (functionPerformed === 'oldUserVerification') {

        try {

            // Finding If User Session Exist In DB Or Not
            const findUserSessionViaID = await sessionsModel.findById(id)
                .select('userName OTPCount')
                .populate({
                    path: "userName", model: "userAccounts",
                    select: "userName"
                });

            // If Not, Means Someone Is Trying To Uh....
            if (findUserSessionViaID === null) {
                return { status: 401, message: "Session Expired!" }
            }

            // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes
            if (findUserSessionViaID.OTPCount >= fetchSettings.otp_limits) {
                return {
                    status: 403,
                    message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                };
            }

            if (findUserSessionViaID.userName.userName === userName) {

                // Generating userOTP Of Length 6
                const userOTP = await randomStringGenerator(6);

                // Ecnrytpiong The OTP
                const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

                // Updating Secured OTP TO DB
                findUserSessionViaID.OTP = encryptedOTP;

                // Incrementing OTP Count To DB
                findUserSessionViaID.OTPCount++;

                // Updating The DB With New Details
                await findUserSessionViaID.save();

                // Finding The Email Of The User
                const findUserAndSendEmail = await userAccountsModel.findOne({ userName }).select('userEmail');

                // Sending The OTP To The User
                await sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'signIn', userIP, userAgent);

                return {
                    status: 201,
                    message: "OTP Resent To The User.",
                };

            } else {

                return { status: 401, message: "Is this Mr. Developer or someone trying to.... uh?", };

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
        await findIfUserNameExistBeforeSending.save();

        // Finding userEmail Via userName
        const findUserAndSendEmail = await userAccountsModel.findOne({ userName }).select('userEmail');

        // Sending OTP To User
        await sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'forgotPassword', userIP, userAgent);

        return {
            status: 201,
            message: "OTP Resent To The User.",
        };

    } else if (functionPerformed === 'changePassword') {

    }
}

export default resendOTP;