//! Please don't use this in your project until & unless your are making a website where admin can add users manually 
//! It will not have any points system too
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
import encryptPassword from "../PasswordHashing/encryptPassword.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";
// @ts-ignore
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS && process.env.ALLOWED_EMAIL_DOMAINS.split(',');
//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
import fetchUserIP from '../utils/fetchUserIP.js';
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}
//! Here adminName means the user trying to add an employee, the name will be saved in userReferredBy
function addAUser(adminName, userFullName, userName, userEmail) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Checking If userFullName Is Valid Or Not
            const regexForuserFullName = /^[a-zA-Z\s]+$/;
            if (!regexForuserFullName.test(userFullName)) {
                return { status: 400, message: "Invalid userFullname" };
            }
            // Checking If userName Is Valid Or Not
            const regexForuserName = /^[a-zA-Z0-9_]+$/;
            if (!regexForuserName.test(userName)) {
                return { status: 400, message: "Invalid userName" };
            }
            // Checking If Email Includes 2 @ Signs
            const regexForuserEmail = /^[a-zA-Z0-9._@]+$/;
            if (userEmail.toLowerCase().includes('@', userEmail.toLowerCase().indexOf('@') + 1) || !regexForuserEmail.test(userEmail)) {
                return { status: 400, message: "Invalid Email Buddy!" };
            }
            // Checking If Email Domain Is Allowed Or Not
            if (Array.isArray(allowedDomains) && !allowedDomains.some((domain) => userEmail.toLowerCase().endsWith(domain))) {
                return { status: 400, message: "Email Isn't From The Allowed Domains From The List." };
            }
            yield connect2MongoDB();
            // Checking If UserName & EmailId Already Exists In DB Or Not
            const existingUser = yield accountsModel.findOne({ $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }] });
            // If User Exist, Notify The Client With The Following Message Depending On The Case
            if (existingUser) {
                let message = "";
                if (existingUser.userName === userName.toLowerCase()) {
                    message += "Username already exists.";
                    return { status: 400, message };
                }
                if (existingUser.userEmail === userEmail.toLowerCase()) {
                    message += "Email ID already exists.";
                    return { status: 400, message };
                }
            }
            // Generating A Unique userReferralCode For The New User
            const userReferralCode = yield generatingUserReferralCode(6);
            // Generating random user password which will be sent to the user via mail
            const userPassword = yield generatingUserReferralCode(18);
            // Secure user password
            const encryptedPassword = yield encryptPassword(userPassword);
            // Checking if the admin exist in DB or someone trying to manipulate the data
            const userAddedBy = yield accountsModel.findOne({ userName: adminName });
            // If admin not found, throw this error
            if (userAddedBy === null) {
                return { status: 403, message: "You are not allowed to do this." };
            }
            // Save New User Details To DB
            yield new accountsModel({
                userFullName,
                userName: userName.toLowerCase(),
                userEmail: userEmail.toLowerCase(),
                userPassword: encryptedPassword,
                userReferralCode: userReferralCode,
                userReferredBy: userAddedBy.userName,
                userVerified: true,
            }).save();
            // Updating the admin's userReferrals field with the user's userName he added
            yield accountsModel.findOneAndUpdate({ userName: adminName }, { $addToSet: { userReferrals: userName } });
            // Fetching User IP
            const userIP = yield fetchUserIP();
            // Here user will get an email with the password regarding that he is added to the management.
            yield sendOTPToUser(userName.toLowerCase(), userEmail.toLowerCase(), userPassword, 'addAUser', userIP);
            return { status: 201, message: "Account Created Successfully", userName: userName.toLowerCase() };
        }
        catch (error) {
            return { status: 500, message: "Internal Server Error" };
        }
    });
}
// Generating Unique Referral Code For New User
function generatingUserReferralCode(number) {
    return __awaiter(this, void 0, void 0, function* () {
        // Random 6 Digit Generation
        const userReferralCode = yield randomStringGenerator(number);
        // Check If Code Already Exist In DB Or Not
        const existingCode = yield accountsModel.findOne({ userReferralCode });
        // If Referral Code Exists, Regenerate New Code
        if (existingCode) {
            return generatingUserReferralCode(number);
        }
        return userReferralCode;
    });
}
export default addAUser;
