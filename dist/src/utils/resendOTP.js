var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { config } from 'dotenv';
config();
// @ts-ignore
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
function resendOTP(username, functionPerformed, token, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const userName = username.toLowerCase();
        yield connect2MongoDB();
        // Generating userOTP Of Length 6
        const userOTP = yield randomStringGenerator(6);
        // It Will Fetch Settings, & Get The OTP Limits Values From The DB
        const fetchSettings = yield settingsModel.findOne({});
        // Fetching userIP
        const userIP = yield fetchUserIP();
        // If New User Verification Needs To Be Done, Run This Function
        if (functionPerformed === 'newUserVerification') {
            // Checking If User Exist In DB Or Not
            const findIfUserNameExistBeforeSending = yield otpModel.findOne({ userName });
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
            const encryptOTP = yield encryptPassword(userOTP);
            // Updating User OTP Count And OTP
            yield otpModel.findOneAndUpdate({ userName }, { OTP: encryptOTP, $inc: { OTPCount: 1 } });
            // Finding The User Email Via userName In The DB
            const findUserAndSendEmail = yield accountsModel.findOne({ userName });
            // Sending OTP To User
            yield sendOTPToUser(userName, findUserAndSendEmail === null || findUserAndSendEmail === void 0 ? void 0 : findUserAndSendEmail.userEmail, userOTP, 'signUp', userIP);
            return {
                status: 201,
                message: "OTP Resent To The User.",
            };
            // If Old User Verification Needs To Be Done, Then, Run This Function
        }
        else if (functionPerformed === 'oldUserVerification') {
            try {
                // Finding If User Session Exist In DB Or Not
                const findUserSessionViaID = yield sessionsModel.findById(id);
                // If Not, Means Someone Is Trying To Uh....
                if (findUserSessionViaID === null) {
                    return {
                        status: 401,
                        message: "Is this Mr. Developer or someone trying to.... uh?"
                    };
                }
                // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes
                if (findUserSessionViaID.OTPCount >= fetchSettings.otp_limits) {
                    return {
                        status: 403,
                        message: "Max OTP Limit Reached, Please Try After 10 Minutes."
                    };
                }
                // Decrypting User IP
                const userIPDecrypted = yield decryptPassword(findUserSessionViaID.userIP);
                if (findUserSessionViaID.userName === userName && findUserSessionViaID.token === token && userIP === userIPDecrypted) {
                    // Generating userOTP Of Length 6
                    const userOTP = yield randomStringGenerator(6);
                    // Ecnrytpiong The OTP
                    const encryptOTP = yield encryptPassword(userOTP);
                    // Updating Secured OTP TO DB
                    findUserSessionViaID.OTP = encryptOTP;
                    // Incrementing OTP Count To DB
                    findUserSessionViaID.OTPCount++;
                    // Updating The DB With New Details
                    yield findUserSessionViaID.save();
                    // Finding The Email Of The User
                    const findUserAndSendEmail = yield accountsModel.findOne({ userName });
                    // Sending The OTP To The User
                    yield sendOTPToUser(userName, findUserAndSendEmail.userEmail, userOTP, 'signIn', userIP);
                    return {
                        status: 201,
                        message: "OTP Resent To The User.",
                    };
                }
                else {
                    return {
                        status: 401,
                        message: "Is this Mr. Developer or someone trying to.... uh?",
                    };
                }
            }
            catch (error) {
                return {
                    status: 401,
                    message: "Is this Mr. Developer or someone trying to.... uh?",
                };
            }
            // If User Needs To Reset The Password, Then, Run This Function
        }
        else if (functionPerformed === 'forgotPassword') {
            // Finding If User Exist In DB Or Not
            const findIfUserNameExistBeforeSending = yield otpModel.findOne({ userName });
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
            const encryptOTP = yield encryptPassword(userOTP);
            // Updating Secured OTP TO DB
            findIfUserNameExistBeforeSending.OTP = encryptOTP;
            // Incrementing OTP Count To DB
            findIfUserNameExistBeforeSending.OTPCount++;
            // Updating The DB With New Details
            yield findIfUserNameExistBeforeSending.save();
            // Finding userEmail Via userName
            const findUserAndSendEmail = yield accountsModel.findOne({ userName });
            // Sending OTP To User
            yield sendOTPToUser(userName, findUserAndSendEmail === null || findUserAndSendEmail === void 0 ? void 0 : findUserAndSendEmail.userEmail, userOTP, 'forgotPassword', userIP);
            return {
                status: 201,
                message: "OTP Resent To The User.",
            };
        }
    });
}
export default resendOTP;
