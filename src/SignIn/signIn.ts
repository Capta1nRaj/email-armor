import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../../models/otpModel.js";
import sessionsModel from "../../models/sessionsModel.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";
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

async function signIn(username: string, userPassword: string | boolean, userAgent: string, userIP: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) {
        return {
            status: 401,
            message: "Your device is unauthorized."
        };
    }

    await connect2MongoDB();

    // Finding If User Exist Or Not From DB
    const findUserToLogin = await userAccountsModel.findOne({ userName: username.toLowerCase() }).select('userVerified userName userEmail userPassword');

    // If userName Don't Exist, Return A Bad Request
    if (!findUserToLogin) {
        return {
            status: 400,
            message: "Please Validate Your Details.",
        };
    }

    // If User Is Verified, Then, Decrypt The User Password
    const decryptedPassword = await bcrypt.compare(userPassword as string, findUserToLogin.userPassword)

    // If incorrect password, Return A Bad Request
    if (!decryptedPassword) { return { status: 400, message: "Please Validate Your Details.", }; }

    // If User Is Not Verified, Redirect User To SignUp Page, & Ask Them To Verify First
    if (!findUserToLogin.userVerified) {

        // Generating OTP
        const userOTP = await randomStringGenerator(6);

        // Encrypting OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

        // Checking If OTP Already Exist In DB Or Not
        const checkIfOTPExistOrNot = await otpModel.findOne({ userName: username.toLowerCase() }).select('OTPCount');

        // If OTP Not Exist, Then, Create A New Doc & Save To DB
        if (!checkIfOTPExistOrNot) {

            await new otpModel({
                userName: username.toLowerCase(),
                OTP: encryptedOTP,
            }).save();

            // If OTP Exist, Then, Find & Update The Doc & Save To DB
        } else {

            // Check If OTP Limit Is Exceeded Or Not
            // If Exceeded Then Don't Generate More OTP

            // It Will Fetch Settings, & Get The OTP Limits Values From The DB
            const fetchSettings = await settingsModel.findOne({}).select('otp_limits');
            if (checkIfOTPExistOrNot.OTPCount >= fetchSettings.otp_limits) {
                return {
                    status: 403,
                    message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                };
            }

            // If Not Exceeded Then Generate New OTP & Increase OTPCount By 1
            await otpModel.updateOne({ userName: username.toLowerCase() }, { $inc: { OTPCount: 1 }, OTP: encryptedOTP }, { new: true });

        }

        // Sending OTP To User Registered E-Mail
        await sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signUp', userIP, userAgent);

        return {
            status: 401,
            message: "Please Verify Your Account",
            userName: username.toLowerCase(),
        };
    }

    // Checking If userName & userPassword Are The Same As Per The Client Entered
    if (findUserToLogin.userName === username.toLowerCase() && decryptedPassword) {

        // Generating OTP
        const userOTP = await randomStringGenerator(6);

        // Encrypting User OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

        // Saving Session To DB
        const savedData = await new sessionsModel({
            userName: findUserToLogin._id,
            OTP: encryptedOTP,
            userAgent: userAgent
        }).save();

        // Sending OTP To User Registered E-Mail
        await sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signIn', userIP, userAgent);

        return {
            status: 201,
            message: "Sign In Successful, OTP Sent To Mail",
            userName: username.toLowerCase(),
            id: savedData.id
        };

    } else {
        return { status: 400, message: "Please Validate Your Details.", };
    }
}

export default signIn;
