//Basic import
import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../models/userAccountsModel.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";
import otpModel from "../../models/otpModel.js";
import nodemailSetup from "../utils/nodemailSetup.js";
import settingsModel from "../../models/settingsModel.js";
import bcrypt from 'bcrypt';

// Checking if BCRYPT_SALT_ROUNDS is a number or not
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}


async function forgotPassword(userEmail: string, userName: string, userAgent: string, userIP: string) {

    // Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) { return { message: "Your device is unauthorized.", status: 401 }; }

    // If both userName and userEmail are undefined, throw an error
    if (!userName && !userEmail) { return { message: "Either userName or userEmail must be provided!", status: 400 }; }

    // Validating userName format if exist
    if (userName) { const regexForuserName = /^[a-zA-Z0-9_]+$/; if (!regexForuserName.test(userName)) { return { message: "Invalid userName!", status: 400 }; } }

    // Validating userEmail address format if exist
    if (userEmail) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(userEmail)) { return { message: "Invalid Email!", status: 400 }; } }

    try {

        // Connecting to MongoDB
        await connect2MongoDB();

        // Validating if user exist
        const findUserToLogin = await userAccountsModel.findOne({
            $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }]
        }).select('_id userName userEmail');

        // If user not found, throw error
        if (!findUserToLogin) { return { message: "Please Validate Your Details.", status: 400 }; }

        // Fetching the forgot password email title & template
        const fetchSettings = await settingsModel.findOne({}).select('forgot_password_mail_title email_template otp_limits');

        // Generating a random 6-digit OTP & saving in DB
        const OTP = await randomStringGenerator(6);

        // Hasing OTP
        const hashingOTP = await bcrypt.hash(OTP, saltRounds)

        // Updating or creating OTP record for the user
        const otpData = await otpModel.findOneAndUpdate(
            { userName: findUserToLogin.userName },  // Search for an existing OTP by userName
            { $set: { OTP: hashingOTP }, $inc: { OTPCount: 1 } },// Set the new OTP value & Increment OTPCount by 1
            { upsert: true, new: true }  // Create a new document if not found, and return the updated document
        ).select('OTPCount');

        // Checking if OTP request limit exceeded or not
        if (otpData.OTPCount >= fetchSettings.otp_limits) { return { message: "OTP request limit exceeded. Please try again later.", status: 429 }; }

        const emailHTMLTemplate = fetchSettings.email_template
            .replaceAll('{{userName}}', findUserToLogin.userName.toLowerCase())
            .replaceAll('{{OTPOrPassword}}', OTP)
            .replaceAll('{{userIP}}', userIP)
            .replaceAll('{{userAgent}}', userAgent)

        // Sending OTP to user's email
        const emailData = { userEmail: findUserToLogin.userEmail, emailSubject: fetchSettings.forgot_password_mail_title, emailHTMLTemplate }
        await nodemailSetup(emailData);

        return { message: "OTP sent to mail!", status: 201 }
    } catch (error) {
        console.error(error)
        // Returning a message with a link to raise a PR on GitHub in case of a server error
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }

}

export default forgotPassword;