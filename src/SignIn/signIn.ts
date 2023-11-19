import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../../models/otpModel.js";
import sessionsModel from "../../models/sessionsModel.js";
import fetchUserIP from '../utils/fetchUserIP.js';
import randomStringGenerator from "../utils/randomStringGenerator.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";
import settingsModel from "../../models/settingsModel.js";

import jwt from 'jsonwebtoken';
const jwtTokenValue = process.env.JWT_TOKEN_VALUE;

import sgMail from "@sendgrid/mail";
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}


//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

import bcrypt from 'bcrypt'
//! Checking if BCRYPT_SALT_ROUNDS is a number or not
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

async function signin(username: string, userPassword: string | boolean) {

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

    // Fetching User IP
    const userIP = await fetchUserIP();

    // If User Is Not Verified, Redirect User To SignUp Page, & Ask Them To Verify First
    if (!findUserToLogin.userVerified) {

        // Generating OTP
        const userOTP = await randomStringGenerator(6);

        // Encrypting OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

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
        await sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signUp', userIP);

        return {
            status: 401,
            message: "Please Verify Your Account",
            userName: username.toLowerCase(),
        };
    }

    // If User Is Verified, Then, Decrypt The User Password

    const decryptedPassword = await bcrypt.compare(userPassword as string, findUserToLogin.userPassword)

    // Checking If userName & userPassword Are The Same As Per The Client Entered
    if (findUserToLogin.userName === username.toLowerCase() && decryptedPassword) {

        // Generating OTP
        const userOTP = await randomStringGenerator(6);

        // Encrypting User OTP
        const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

        // Saving Session To DB
        const savedData = await new sessionsModel({
            userName: username.toLowerCase(),
            OTP: encryptedOTP,
        }).save();

        // Sending OTP To User Registered E-Mail
        await sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signIn', userIP);

        var token = jwt.sign({ msg: "ss" }, jwtTokenValue as string);
        return {
            status: 201,
            message: "Sign In Successful, OTP Sent To Mail",
            userName: username.toLowerCase(),
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
