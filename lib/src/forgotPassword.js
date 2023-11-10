var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../models/otpModel";
import sendOTPToUser from "./sendOTPToUser";
import randomStringGenerator from "./randomStringGenerator";
import encryptPassword from "./PasswordHashing/encryptPassword.js";
import decryptPassword from "./PasswordHashing/decryptPassword.js";
import settingsModel from "../models/settingsModel.js";
//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}
function forgotPassword(username, OTP, newPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (username.toLowerCase().length === 0) {
                return {
                    status: 401,
                    message: "Is this Mr. Developer or someone trying to.... uh?",
                };
            }
            // Using This Case, We Are Generating OTP For User To Authenticate
            if (username.toLowerCase() !== undefined && OTP === undefined && newPassword === undefined) {
                yield connect2MongoDB();
                // First We Find If User Exist Or Not
                const finduserAndSendEmailForVerification = yield accountsModel.findOne({ userName: username.toLowerCase() });
                // If Not, Client Will Receive This Response
                if (finduserAndSendEmailForVerification === null) {
                    return {
                        status: 400,
                        message: "Username Doesn't Exist."
                    };
                    // If Exist, OTP Will Be Generated
                }
                else if (finduserAndSendEmailForVerification !== null) {
                    // Checking If OTP Already Exist In DB Or Not
                    const checkIfUserAlreadyRequestedForOTP = yield otpModel.findOne({ userName: username.toLowerCase() });
                    // If Not, Then, Save The OTP In DB
                    if (checkIfUserAlreadyRequestedForOTP === null) {
                        // Generating Random OTP
                        const userOTP = yield randomStringGenerator(6);
                        // Securing OTP Via Crypto
                        const encryptedOTP = yield encryptPassword(userOTP);
                        // Sending OTP To The User
                        yield sendOTPToUser(finduserAndSendEmailForVerification.userName, finduserAndSendEmailForVerification.userEmail, userOTP, 'forgotPassword');
                        // Saving Details To DB
                        new otpModel({
                            userName: username.toLowerCase(),
                            OTP: encryptedOTP
                        }).save();
                        return {
                            status: 201,
                            message: "OTP Sent To Mail",
                            userName: username.toLowerCase(),
                        };
                        // If OTP Exist, Then, Update The Docuement In The DB
                    }
                    else if (checkIfUserAlreadyRequestedForOTP !== null) {
                        // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes
                        // It Will Fetch Settings, & Get The OTP Limits Values From The DB
                        const fetchSettings = yield settingsModel.findOne({});
                        if (fetchSettings === null) {
                            return {
                                status: 400,
                                message: "Please run npx email-armor init.",
                            };
                        }
                        if (checkIfUserAlreadyRequestedForOTP.OTPCount >= fetchSettings.otp_limits) {
                            return {
                                status: 403,
                                message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                            };
                        }
                        // Generating Random OTP
                        const userOTP = yield randomStringGenerator(6);
                        // Securing OTP Via Crypto
                        const encryptedOTP = yield encryptPassword(userOTP);
                        // Sending OTP To The User
                        yield sendOTPToUser(finduserAndSendEmailForVerification.userName, finduserAndSendEmailForVerification.userEmail, userOTP, 'forgotPassword');
                        // Find & update OTP
                        yield otpModel.findOneAndUpdate({ username }, { $set: { OTP: encryptedOTP }, $inc: { OTPCount: 1 } });
                        return {
                            status: 201,
                            message: "OTP Sent To Mail",
                            userName: username.toLowerCase(),
                        };
                    }
                }
                // When User Enters OTP, & New Password, Then,
                // First We Will Validate The OTP, Then, If OTP Corrent We Update The Password, Else We Throw Error As Response To The Client
            }
            else if (username.toLowerCase() !== undefined && OTP !== undefined && newPassword !== undefined) {
                // If User Enters OTP With Length Greater Than 6, Throw An Error
                if (OTP.length > 6) {
                    return {
                        status: 400,
                        message: "Wrong OTP",
                    };
                }
                // If User Passowrd Length Is Lesser Than 8, Throw An Error
                if (newPassword.length <= 8) {
                    return {
                        status: 206,
                        message: "Min. Password Length Must Be Greater Than 8",
                    };
                }
                yield connect2MongoDB();
                // Find The OTP In The DB To Verify
                const finduserAndSendEmailForVerification = yield otpModel.findOne({ userName: username.toLowerCase() });
                if (finduserAndSendEmailForVerification !== null) {
                    // Decrypting The OTP From The User
                    const decryptedOTP = (OTP === (yield decryptPassword(finduserAndSendEmailForVerification.OTP)));
                    // If OTP Is False, Client Will Recevie This Response
                    if (decryptedOTP === false) {
                        return {
                            status: 400,
                            message: "Wrong OTP"
                        };
                        // If OTP Is True, Then, Find & Update The Password Of The Client
                    }
                    else if (decryptedOTP === true) {
                        const encryptedPassword = yield encryptPassword(newPassword);
                        const findAndUpdatePassword = yield accountsModel.findOneAndUpdate({ userName: username.toLowerCase() }, { userPassword: encryptedPassword }, { new: true });
                        const deleteTheOTPModel = yield otpModel.findOneAndDelete({ userName: username.toLowerCase() });
                        return {
                            status: 200,
                            message: "Password Updated."
                        };
                    }
                }
            }
        }
        catch (error) {
            return {
                status: 401,
                message: "Is this Mr. Developer or someone trying to.... uh?",
            };
        }
    });
}
export default forgotPassword;
