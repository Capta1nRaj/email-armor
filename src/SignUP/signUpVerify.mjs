import { connect2MongoDB } from "connect2mongodb";
import accountsModel from "../../models/accountsModel.mjs";
import otpModel from '../../models/otpModel.mjs';
import settingsModel from '../../models/settingsModel.mjs';
import decryptPassword from "../PasswordHashing/decryptPassword.mjs";

async function signUpVerify(username, otp) {

    await connect2MongoDB();

    // Firstly, It Will Find If User Exist In otpModel Or Not
    const getUserDetailsAndOTP = await otpModel.findOne({ userName: username.toLowerCase() })

    // If No Document's With The Given userName Exist In DB, Return 400 Status Code
    if (!getUserDetailsAndOTP) {
        return {
            status: 400,
            message: "No Accounts Were Found To Verify",
        };
    }

    // Decrypting The OTP From The User
    const decryptedOTP = (otp === await decryptPassword(getUserDetailsAndOTP.OTP));

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
        const getTheUserWhomHeGotReferred = await accountsModel.findOne({ userName: getUserDetailsAndOTP.userName })

        // If User Is Referred By None
        if (getTheUserWhomHeGotReferred.userReferredBy.length === 0) {

            // It Will Simply Verify The User's Account.
            const verifyUser = await accountsModel.findOneAndUpdate({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: 0 } }, { new: true });

            // If User Is Referred By Someone
        } else if (getTheUserWhomHeGotReferred.userReferredBy.length !== 0) {

            // It Will Fetch Settings, & Get The Points Values From The DB
            const fetchSettings = await settingsModel.findOne({})

            // First, It Will Verify The User's Account And Assign Them The Referral Points (REFERRED_PERSON_POINTS as per JSON File)
            const verifyUser = await accountsModel.findOneAndUpdate({ userName: username.toLowerCase() }, { $set: { userVerified: true }, $inc: { points: fetchSettings.referred_person_points } }, { new: true });

            // Secondly, It Will Update The Points For The User (REFERRED_POINTS As Per JSON File) Who Referred Them And Add The User's userName To The Referrer's List
            // It Will User The Referral Code To Find The User Who Referred A New User
            var updateTheReferralPoints = await accountsModel.findOneAndUpdate({ userName: getTheUserWhomHeGotReferred.userReferredBy }, { $addToSet: { userReferrals: getTheUserWhomHeGotReferred.userName }, $inc: { points: fetchSettings.referred_points } }, { new: true });
        }

        // Delete The OTP From otpModel Collection
        const deleteUserOTPDocument = await otpModel.findOneAndDelete({ userName: username.toLowerCase() })

        return {
            status: 202,
            message: "Account Verified"
        }
    }
}

export default signUpVerify;