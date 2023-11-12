//! Please don't use this in your project until & unless your are making a website where admin can add users manually 

import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import encryptPassword from "../PasswordHashing/encryptPassword.mjs";
import randomStringGenerator from "../utils/randomStringGenerator.mjs";
import sendOTPToUser from "../utils/sendOTPToUser.mjs";

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.mjs";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

async function addAUser(userFullName, userName, userEmail) {

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
        if (!allowedDomains.some(domain => userEmail.toLowerCase().endsWith(domain))) {
            return { status: 400, message: "Email Isn't From The Allowed Domains From The List." };
        }

        await connect2MongoDB();

        // Checking If UserName & EmailId Already Exists In DB Or Not
        const existingUser = await accountsModel.findOne({ $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }] });

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
        const userReferralCode = await generatingUserReferralCode(6);

        // Generating random user password which will be sent to the user via mail
        const userPassword = await generatingUserReferralCode(18);
        // Secure user password
        const encryptedPassword = await encryptPassword(userPassword);

        // Save New User Details To DB
        await new accountsModel({
            userFullName,
            userName: userName.toLowerCase(),
            userEmail: userEmail.toLowerCase(),
            userPassword: encryptedPassword,
            userReferralCode: userReferralCode,
            userReferredBy: "",
            userVerified: true,
        }).save();

        // Here user will get an email with the password regarding that he is added to the management.
        await sendOTPToUser(userName.toLowerCase(), userEmail.toLowerCase(), userPassword, 'addAUser');

        return { status: 201, message: "Account Created Successfully", userName: userName.toLowerCase() };

    } catch (error) {
        return { status: 500, message: "Internal Server Error" };
    }
}

// Generating Unique Referral Code For New User
async function generatingUserReferralCode(number) {
    // Random 6 Digit Generation
    const userReferralCode = await randomStringGenerator(number);

    // Check If Code Already Exist In DB Or Not
    const existingCode = await accountsModel.findOne({ userReferralCode });

    // If Referral Code Exists, Regenerate New Code
    if (existingCode) {
        return generatingUserReferralCode();
    }
    return userReferralCode;
}

export default addAUser;