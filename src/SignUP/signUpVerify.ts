import { config } from 'dotenv';
config();

import { connect2MongoDB } from "connect2mongodb";
import otpModel from '../../models/otpModel.js';
import settingsModel from '../../models/settingsModel.js';

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

async function signUpVerify(username: string, otp: string) {

    await connect2MongoDB();

    // Firstly, It Will Find If User Exist In otpModel Or Not
    const getUserDetailsAndOTP = await otpModel.findOne({ userName: username.toLowerCase() }).select('userName OTP');

    // If No Document's With The Given userName Exist In DB, Return 400 Status Code
    if (!getUserDetailsAndOTP) {
        return {
            status: 400,
            message: "No Accounts Were Found To Verify",
        };
    }

    // Decrypting The OTP From The User
    const decryptedOTP = await bcrypt.compare(otp, getUserDetailsAndOTP.OTP);

    // If User Enters Wrong OTP
    if (decryptedOTP === false) {

        return {
            status: 400,
            message: "Wrong OTP",
        };

        // If User Enters Correct OTP
    } else if (decryptedOTP === true) {

        // It Will Find The New User's username, And As Per The Document, If The User Entered The Correct Referral Code, They Will Receive (Referred_points As Per The Json File) Points From The Referrer And Get Added To The Referrer's List With Their Name.
        // The Referrer Gets (Referred_person_points As Per The Json File) Points. 
        // If The User Didn't Enter Any Referral Code, Then They Will Not Get Any Points.
        const getTheUserWhomHeGotReferred = await accountsModel.findOne({ userName: getUserDetailsAndOTP.userName }).select('userName userReferredBy');

        // If User Is Referred By None
        if (getTheUserWhomHeGotReferred.userReferredBy.length === 0) {

            // It Will Simply Verify The User's Account.
            accountsModel.updateOne({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: 0 } }, { new: true }).then();

            // If User Is Referred By Someone
        } else if (getTheUserWhomHeGotReferred.userReferredBy.length !== 0) {

            // It Will Fetch Settings, & Get The Points Values From The DB
            const fetchSettings = await settingsModel.findOne({}).select('referred_person_points referred_points');

            // First, It Will Verify The User's Account And Assign Them The Referral Points (REFERRED_PERSON_POINTS as per JSON File)
            accountsModel.updateOne({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: fetchSettings.referred_person_points } }, { new: true }).then();

            // Secondly, It Will Update The Points For The User (REFERRED_POINTS As Per JSON File) Who Referred Them And Add The User's userName To The Referrer's List
            // It Will User The Referral Code To Find The User Who Referred A New User
            accountsModel.updateOne({ userName: getTheUserWhomHeGotReferred.userReferredBy }, { $addToSet: { userReferrals: getTheUserWhomHeGotReferred.userName }, $inc: { points: fetchSettings.referred_points } }, { new: true }).then();
        }

        // Delete The OTP From otpModel Collection
        otpModel.deleteOne({ userName: username.toLowerCase() }).then();

        return {
            status: 202,
            message: "Account Verified"
        }
    }
}

export default signUpVerify;