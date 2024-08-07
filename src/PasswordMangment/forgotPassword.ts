import { connect2MongoDB } from "connect2mongodb";
import otpModel from "../../models/otpModel.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import settingsModel from "../../models/settingsModel.js";

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
import userAccountsModel from "../../models/userAccountsModel.js";
import sessionsModel from "../../models/sessionsModel.js";
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

async function forgotPassword(username: string, userAgent: string, OTP: string, newPassword: string, userIP: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

    try {

        if (username.toLowerCase().length === 0) {

            return {
                status: 401,
                message: "Is this Mr. Developer or someone trying to.... uh?",
            };

        }

        // Using This Case, We Are Generating OTP For User To Authenticate
        if (username.toLowerCase() && !OTP && !newPassword) {

            await connect2MongoDB();

            // First We Find If User Exist Or Not
            const finduserAndSendEmailForVerification = await userAccountsModel.findOne({ userName: username.toLowerCase() }).select('userName userEmail OTP');

            // If Not, Client Will Receive This Response
            if (!finduserAndSendEmailForVerification) {

                return { status: 400, message: "Username Doesn't Exist." }

                // If Exist, OTP Will Be Generated
            } else if (finduserAndSendEmailForVerification) {

                // Checking If OTP Already Exist In DB Or Not
                const checkIfUserAlreadyRequestedForOTP = await otpModel.findOne({ userName: username.toLowerCase() }).select('OTPCount');

                // If Not, Then, Save The OTP In DB
                if (checkIfUserAlreadyRequestedForOTP === null) {

                    // Generating Random OTP
                    const userOTP = await randomStringGenerator(6);

                    // Securing OTP via bcrypt
                    const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

                    // Sending OTP To The User
                    await sendOTPToUser(finduserAndSendEmailForVerification.userName, finduserAndSendEmailForVerification.userEmail, userOTP, 'forgotPassword', userIP, userAgent)

                    // Saving Details To DB
                    await new otpModel({
                        userName: username.toLowerCase(),
                        OTP: encryptedOTP
                    }).save();

                    return { status: 201, message: "OTP Sent To Mail", userName: username.toLowerCase(), };

                    // If OTP Exist, Then, Update The Docuement In The DB
                } else if (checkIfUserAlreadyRequestedForOTP !== null) {

                    // If It Reaches The Limit i.e. OTP_LIMITS in JSON file, Then, Tell User To Try After 10 Minutes

                    // It Will Fetch Settings, & Get The OTP Limits Values From The DB
                    const fetchSettings = await settingsModel.findOne({}).select('otp_limits');
                    if (checkIfUserAlreadyRequestedForOTP.OTPCount >= fetchSettings.otp_limits) {
                        return { status: 403, message: "Max OTP Limit Reached, Please Try After 10 Minutes." };
                    }

                    // Generating Random OTP
                    const userOTP = await randomStringGenerator(6);

                    // Securing OTP via bcrypt
                    const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

                    // Sending OTP To The User
                    await sendOTPToUser(finduserAndSendEmailForVerification.userName, finduserAndSendEmailForVerification.userEmail, userOTP, 'forgotPassword', userIP, userAgent)

                    // Updating The Document With New OTP Value
                    checkIfUserAlreadyRequestedForOTP.OTP = encryptedOTP;

                    // Incrementing OTP Count To DB
                    checkIfUserAlreadyRequestedForOTP.OTPCount++;

                    // Updating The DB With New Details
                    await checkIfUserAlreadyRequestedForOTP.save();

                    return {
                        status: 201,
                        message: "OTP Sent To Mail",
                        userName: username.toLowerCase(),
                    };

                }
            }

            // When User Enters OTP, & New Password, Then,
            // First We Will Validate The OTP, Then, If OTP Corrent We Update The Password, Else We Throw Error As Response To The Client
        } else if (username.toLowerCase() && OTP && newPassword) {

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
                    message: "Min. Password Length Must Be Greater Than 8.",
                };
            }

            await connect2MongoDB();

            // Find The OTP In The DB To Verify
            const finduserAndSendEmailForVerification = await otpModel.findOne({ userName: username.toLowerCase() }).select('OTP');

            // Decrypting The OTP From The User
            const decryptedOTP = await bcrypt.compare(OTP, finduserAndSendEmailForVerification.OTP)

            // If OTP Is False, Client Will Recevie This Response
            if (decryptedOTP === false) {

                return {
                    status: 400,
                    message: "Wrong OTP"
                }

                // If OTP Is True, Then, Find & Update The Password Of The Client
            } else if (decryptedOTP === true) {

                // Encrypting the password
                const encryptedPassword = await bcrypt.hash(newPassword, saltRounds);

                // Update the password
                const getUserID = await userAccountsModel.findOneAndUpdate({ userName: username.toLowerCase() }, { userPassword: encryptedPassword }).select('_id');

                // Delete the OTP in DB
                await otpModel.deleteOne({ userName: username.toLowerCase() });

                // Deleting the old user session
                await sessionsModel.deleteMany({ userName: getUserID._id });

                return { status: 200, message: "Password Updated." }
            }
        }

    } catch (error) {

        return {
            status: 401,
            message: "Is this Mr. Developer or someone trying to.... uh?",
        };

    }

}

export default forgotPassword;