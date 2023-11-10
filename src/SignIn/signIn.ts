import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../../models/otpModel.js";
import sessionsModel from "../../models/sessionsModel.js";
import encryptPassword from "../PasswordHashing/encryptPassword.js";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import fetchUserIP from "../fetchUserIP";
import randomStringGenerator from "../randomStringGenerator";
import sendOTPToUser from "../sendOTPToUser";

import settingsModel from "../../models/settingsModel.js";

import sgMail from "@sendgrid/mail";
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.error('SENDGRID_API_KEY is not defined.');
}
  

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

async function signin(username: string, userPassword: string) {

    await connect2MongoDB();

    // Finding If User Exist Or Not Fron userName
    const findUserToLogin = await accountsModel.findOne({ userName: username.toLowerCase() });

    // If userName Don't Exist, Return A Bad Request
    if (!findUserToLogin) {
        return {
            status: 400,
            message: "Please Validate Your Details",
        };
    }

    // If User Is Not Verified, Redirect User To SignUp Page, & Ask Them To Verify First
    if (!findUserToLogin.userVerified) {

        // Generating OTP
        const userOTP = await randomStringGenerator(6);

        // Encrypting OTP
        const encryptedOTP = await encryptPassword(userOTP);

        // Checking If OTP Already Exist In DB Or Not
        const checkIfOTPExistOrNot = await otpModel.findOne({ userName: username.toLowerCase() });

        // If OTP Not Exist, Then, Create A New Doc & Save To DB
        if (!checkIfOTPExistOrNot) {

            new otpModel({
                userName: username.toLowerCase(),
                OTP: encryptedOTP,
            }).save();

            // If OTP Exist, Then, Find & Update The Doc & Save To DB
        } else {

            // Check If OTP Limit Is Exceeded Or Not
            // If Exceeded Then Don't Generate More OTP

            // It Will Fetch Settings, & Get The OTP Limits Values From The DB
            const fetchSettings = await settingsModel.findOne({})
            if(fetchSettings === null){
                return {
                    status: 400,
                    message: "Please run npx email-armor init.",
                };
            }

            if (checkIfOTPExistOrNot.OTPCount >= fetchSettings.otp_limits) {
                return {
                    status: 403,
                    message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                };
            }

            // If Not Exceeded Then Generate New OTP & Increase OTPCount By 1
            await otpModel.findOneAndUpdate({ userName: username.toLowerCase() }, { $inc: { OTPCount: 1 }, OTP: encryptedOTP }, { new: true });

        }

        // Sending OTP To User Registered E-Mail
        await sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signUp');

        return {
            status: 401,
            message: "Please Verify Your Account",
            userName: username.toLowerCase(),
        };
    }

    // If User Is Verified, Then, Decrypt The User Password
    const decryptedPassword = userPassword === await decryptPassword(findUserToLogin.userPassword);

    // Fetching User IP
    const userIP = await fetchUserIP();

    // Checking If userName & userPassword Are The Same As Per The Client Entered
    if (findUserToLogin.userName === username.toLowerCase() && decryptedPassword) {

        // Generating Token Address Of 128 Length
        const userTokenAddress = await randomStringGenerator(128);

        // Generating OTP
        const userOTP = await randomStringGenerator(6);

        // Encryptiong User IP
        const encryptedUserIP = await encryptPassword(userIP);

        // Encrypting User OTP
        const encryptedOTP = await encryptPassword(userOTP);

        // Saving Session To DB
        const savedData = await new sessionsModel({
            userName: username.toLowerCase(),
            token: userTokenAddress,
            userIP: encryptedUserIP,
            OTP: encryptedOTP,
        }).save();

        // Sending OTP To User Registered E-Mail
        await sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signIn');

        return {
            status: 201,
            message: "Sign In Successful, OTP Sent To Mail",
            userName: username.toLowerCase(),
            token: userTokenAddress,
            id: savedData.id
        };

    } else {

        return {
            status: 400,
            message: "Please Validate Your Details",
        };

    }
}

export default signin;