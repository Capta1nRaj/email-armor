var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import { config } from 'dotenv';
config();
// @ts-ignore
import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../../models/otpModel.js";
import sessionsModel from "../../models/sessionsModel.js";
import encryptPassword from "../PasswordHashing/encryptPassword.js";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import fetchUserIP from '../utils/fetchUserIP.js';
import randomStringGenerator from "../utils/randomStringGenerator.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";
import settingsModel from "../../models/settingsModel.js";
// @ts-ignore
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
function signin(username, userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        yield connect2MongoDB();
        // Finding If User Exist Or Not Fron userName
        const findUserToLogin = yield accountsModel.findOne({ userName: username.toLowerCase() });
        // If userName Don't Exist, Return A Bad Request
        if (!findUserToLogin) {
            return {
                status: 400,
                message: "Please Validate Your Details",
            };
        }
        // Fetching User IP
        const userIP = yield fetchUserIP();
        // If User Is Not Verified, Redirect User To SignUp Page, & Ask Them To Verify First
        if (!findUserToLogin.userVerified) {
            // Generating OTP
            const userOTP = yield randomStringGenerator(6);
            // Encrypting OTP
            const encryptedOTP = yield encryptPassword(userOTP);
            // Checking If OTP Already Exist In DB Or Not
            const checkIfOTPExistOrNot = yield otpModel.findOne({ userName: username.toLowerCase() });
            // If OTP Not Exist, Then, Create A New Doc & Save To DB
            if (!checkIfOTPExistOrNot) {
                new otpModel({
                    userName: username.toLowerCase(),
                    OTP: encryptedOTP,
                }).save();
                // If OTP Exist, Then, Find & Update The Doc & Save To DB
            }
            else {
                // Check If OTP Limit Is Exceeded Or Not
                // If Exceeded Then Don't Generate More OTP
                // It Will Fetch Settings, & Get The OTP Limits Values From The DB
                const fetchSettings = yield settingsModel.findOne({});
                if (checkIfOTPExistOrNot.OTPCount >= fetchSettings.otp_limits) {
                    return {
                        status: 403,
                        message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                    };
                }
                // If Not Exceeded Then Generate New OTP & Increase OTPCount By 1
                yield otpModel.findOneAndUpdate({ userName: username.toLowerCase() }, { $inc: { OTPCount: 1 }, OTP: encryptedOTP }, { new: true });
            }
            // Sending OTP To User Registered E-Mail
            yield sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signUp', userIP);
            return {
                status: 401,
                message: "Please Verify Your Account",
                userName: username.toLowerCase(),
            };
        }
        // If User Is Verified, Then, Decrypt The User Password
        const decryptedPassword = userPassword === (yield decryptPassword(findUserToLogin.userPassword));
        // Checking If userName & userPassword Are The Same As Per The Client Entered
        if (findUserToLogin.userName === username.toLowerCase() && decryptedPassword) {
            // Generating Token Address Of 128 Length
            const userTokenAddress = yield randomStringGenerator(128);
            // Generating OTP
            const userOTP = yield randomStringGenerator(6);
            // Encryptiong User IP
            const encryptedUserIP = yield encryptPassword(userIP);
            // Encrypting User OTP
            const encryptedOTP = yield encryptPassword(userOTP);
            // Saving Session To DB
            const savedData = yield new sessionsModel({
                userName: username.toLowerCase(),
                token: userTokenAddress,
                userIP: encryptedUserIP,
                OTP: encryptedOTP,
            }).save();
            // Sending OTP To User Registered E-Mail
            yield sendOTPToUser(username.toLowerCase(), findUserToLogin.userEmail, userOTP, 'signIn', userIP);
            return {
                status: 201,
                message: "Sign In Successful, OTP Sent To Mail",
                userName: username.toLowerCase(),
                token: userTokenAddress,
                id: savedData.id
            };
        }
        else {
            return {
                status: 400,
                message: "Please Validate Your Details",
            };
        }
    });
}
export default signin;
