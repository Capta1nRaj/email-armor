//! Please don't use this in your project until & unless your are making a website where admin can add users manually 
//! It will not have any points system too

import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";

const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS && process.env.ALLOWED_EMAIL_DOMAINS.split(',');

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
import userAccountsModel from '../../models/userAccountsModel.js';
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

//! Here adminName means the user trying to add an employee, & the name will be saved in userReferredBy
async function customAddAUser(adminName: string, userFullName: string, userName: string, userEmail: string, userRole: string, userBankName: string, userIFSCCode: string, userAccountNumber: string, uniqueIdentifiers: string[], userAgent: string, userIP: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) {
        return {
            status: 401,
            message: "Your device is unauthorized."
        };
    }

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
        if (Array.isArray(allowedDomains) && !allowedDomains.some((domain: string) => userEmail.toLowerCase().endsWith(domain))) {
            return { status: 400, message: "Email Isn't From The Allowed Domains From The List." };
        }

        await connect2MongoDB();

        // Checking If UserName & EmailId Already Exists In DB Or Not
        const existingUser = await userAccountsModel.findOne({ $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }] }).select('userName userEmail');

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
        const userPassword = await randomStringGenerator(18);

        // Secure user password
        const encryptedPassword = await bcrypt.hash(userPassword, saltRounds);

        // Checking if the admin exist in DB or someone trying to manipulate the data
        const userAddedBy = await userAccountsModel.findOne({ userName: adminName }).select('userName');

        // If admin not found, throw this error
        if (userAddedBy === null) {
            return { status: 403, message: "You are not allowed to do this." };
        }

        // Save New User Details To DB
        await new userAccountsModel({
            userFullName,
            userName: userName.toLowerCase(),
            userEmail: userEmail.toLowerCase(),
            userPassword: encryptedPassword,
            userReferralCode: userReferralCode,
            userReferredBy: userAddedBy.userName,
            userVerified: true,
            userBankDetails: [
                {
                    bankName: userBankName || "",
                    accountNumber: userAccountNumber || "",
                    ifscCode: userIFSCCode || ""
                }
            ],
            userUniqueIdentification: uniqueIdentifiers || [],
            userRole: userRole || ""
        }).save();

        // Updating the admin's userReferrals field with the user's userName he added
        await userAccountsModel.updateOne({ userName: adminName }, { $addToSet: { userReferrals: userName } });

        // Here user will get an email with the password regarding that he is added to the management.
        await sendOTPToUser(userName.toLowerCase(), userEmail.toLowerCase(), userPassword, 'addAUser', userIP, userAgent);

        return { status: 201, message: "Account Created Successfully", userName: userName.toLowerCase() };
    } catch (error) {
        return { status: 500, message: "Internal Server Error" };
    }
}

// Generating Unique Referral Code For New User
async function generatingUserReferralCode(number: number) {
    // Random 6 Digit Generation
    const userReferralCode = await randomStringGenerator(number);

    // Check If Code Already Exist In DB Or Not
    const existingCode = await userAccountsModel.exists({ userReferralCode });

    // If Referral Code Exists, Regenerate New Code
    if (existingCode) {
        return generatingUserReferralCode(number);
    }
    return userReferralCode;
}

export default customAddAUser;