import settingsModel from "../../../models/settingsModel.js";
import nodemailSetup from "../../utils/nodemailSetup.js";
import randomStringGenerator from "../../utils/randomStringGenerator.js";
import bcrypt from 'bcrypt';
// Checking if BCRYPT_SALT_ROUNDS is a number or not
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

export async function sendSignInOTP(userEmail: string, userName: string, userIP: string, userAgent: string) {
    // Generating a random 6-digit OTP & saving in DB
    const OTP = await randomStringGenerator(6);

    // Hasing OTP
    const hashingOTP = await bcrypt.hash(OTP, saltRounds);

    // Fetching the forgot password email title & template
    const fetchSettings = await settingsModel.findOne({}).select('sign_in_mail_title email_template');

    const emailHTMLTemplate = fetchSettings.email_template
        .replaceAll('{{userName}}', userName.toLowerCase())
        .replaceAll('{{OTPOrPassword}}', OTP)
        .replaceAll('{{userIP}}', userIP)
        .replaceAll('{{userAgent}}', userAgent)

    // Sending OTP to user's email
    const emailData = { userEmail: userEmail, emailSubject: fetchSettings.sign_in_mail_title, emailHTMLTemplate }
    await nodemailSetup(emailData);

    return hashingOTP;
}