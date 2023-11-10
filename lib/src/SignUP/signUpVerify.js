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
import { connect2MongoDB } from "connect2mongodb";
import otpModel from '../../models/otpModel.js';
import settingsModel from '../../models/settingsModel.js';
import decryptPassword from "../PasswordHashing/decryptPassword.js";
//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}
function signUpVerify(username, otp) {
    return __awaiter(this, void 0, void 0, function* () {
        yield connect2MongoDB();
        // Firstly, It Will Find If User Exist In otpModel Or Not
        const getUserDetailsAndOTP = yield otpModel.findOne({ userName: username.toLowerCase() });
        // If No Document's With The Given userName Exist In DB, Return 400 Status Code
        if (!getUserDetailsAndOTP) {
            return {
                status: 400,
                message: "No Accounts Were Found To Verify",
            };
        }
        // Decrypting The OTP From The User
        const decryptedOTP = (otp === (yield decryptPassword(getUserDetailsAndOTP.OTP)));
        // If User Enters Wrong OTP
        if (decryptedOTP === false) {
            return {
                status: 400,
                message: "Wrong OTP",
            };
            // If User Enters Correct OTP
        }
        else if (decryptedOTP === true) {
            // It Will Find The New User's username, And As Per The Document, If The User Entered The Correct Referral Code, They Will Receive (Referred_points As Per The Json File) Points From The Referrer And Get Added To The Referrer's List With Their Name.
            // The Referrer Gets (Referred_person_points As Per The Json File) Points. 
            // If The User Didn't Enter Any Referral Code, Then They Will Not Get Any Points.
            const getTheUserWhomHeGotReferred = yield accountsModel.findOne({ userName: getUserDetailsAndOTP.userName });
            // If User Is Referred By None
            if (getTheUserWhomHeGotReferred.userReferredBy.length === 0) {
                // It Will Simply Verify The User's Account.
                const verifyUser = yield accountsModel.findOneAndUpdate({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: 0 } }, { new: true });
                // If User Is Referred By Someone
            }
            else if (getTheUserWhomHeGotReferred.userReferredBy.length !== 0) {
                // It Will Fetch Settings, & Get The Points Values From The DB
                const fetchSettings = yield settingsModel.findOne({});
                // First, It Will Verify The User's Account And Assign Them The Referral Points (REFERRED_PERSON_POINTS as per JSON File)
                const verifyUser = yield accountsModel.findOneAndUpdate({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: fetchSettings === null || fetchSettings === void 0 ? void 0 : fetchSettings.referred_person_points } }, { new: true });
                // Secondly, It Will Update The Points For The User (REFERRED_POINTS As Per JSON File) Who Referred Them And Add The User's userName To The Referrer's List
                // It Will User The Referral Code To Find The User Who Referred A New User
                var updateTheReferralPoints = yield accountsModel.findOneAndUpdate({ userName: getTheUserWhomHeGotReferred.userReferredBy }, { $addToSet: { userReferrals: getTheUserWhomHeGotReferred.userName }, $inc: { points: fetchSettings === null || fetchSettings === void 0 ? void 0 : fetchSettings.referred_points } }, { new: true });
            }
            // Delete The OTP From otpModel Collection
            const deleteUserOTPDocument = yield otpModel.findOneAndDelete({ userName: username.toLowerCase() });
            return {
                status: 202,
                message: "Account Verified"
            };
        }
    });
}
export default signUpVerify;
