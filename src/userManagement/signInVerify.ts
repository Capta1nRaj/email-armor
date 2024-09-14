// Basic imports
import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import settingsModel from "../../models/settingsModel.js";
import { sendSignInOTP } from "./utils/sendSignInOTP.js";
config();

// Checking if BCRYPT_SALT_ROUNDS is a number or not
let saltRounds: number;
if (!process.env.BCRYPT_SALT_ROUNDS || isNaN(Number(process.env.BCRYPT_SALT_ROUNDS))) {
    throw new Error("BCRYPT_SALT_ROUNDS is either undefined or not a valid number");
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

// Retrieving jwt environment variables
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`${key} is undefined.`);
    return value;
}

const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');
let expireJwtToken: string | null = getEnvVariable('EXPIRE_JWT_TOKEN');
if (expireJwtToken === '0') expireJwtToken = null;

// Sign-in verification function
async function signInVerify(id: string, otp: string, userAgent: string, method: string, userIP: string) {
    try {
        // Check if userAgent is present
        if (!userAgent) return { message: "Your device is unauthorized.", status: 401 };

        // Connect to MongoDB
        await connect2MongoDB();

        // Fetch session data
        const findUserSession = await sessionsModel.findById(id).select('_id userAgent OTP OTPCount')
            .populate({ path: "userName", model: "userAccounts", select: "userEmail userName" });
        if (!findUserSession || !findUserSession.OTP) return { message: "Session not found", status: 404 };

        if (method === 'resend') {

            // Fetch settings for email template, subject, and OTP resend limit
            const fetchSettings = await settingsModel.findOne({}).select('otp_limits');

            // Check if the user has exceeded the allowed number of OTP resend attempts
            if (findUserSession.OTPCount >= fetchSettings.otp_limits) { return { message: "You have exceeded the maximum number of OTP resend attempts.", status: 400 }; }

            // Sending OTP mail to user, & getting hashed OTP in return to store in DB
            const hashingOTP = await sendSignInOTP(findUserSession.userName.userEmail, findUserSession.userName.userName, userIP, userAgent);

            // Update the session in the database with the new hashed OTP and increment OTP resend count
            await sessionsModel.updateOne({ _id: id }, { $set: { OTP: hashingOTP }, $inc: { OTPCount: 1 } });

            // Return success message
            return { signedJWTToken: "", message: "OTP has been resent to your email!", status: 200 };

        } else if (method === 'verify') {
            // Verify OTP and userAgent
            const isOTPValid = await bcrypt.compare(otp, findUserSession.OTP);
            const isUserAgentValid = userAgent === findUserSession.userAgent;

            if (isUserAgentValid && isOTPValid) {
                // Hash userAgent
                const hashedUserAgent = await bcrypt.hash(findUserSession.userAgent, saltRounds);

                // Create JWT token data
                const jwtData = { userName: findUserSession.userName.userName.toLowerCase(), userAgent: hashedUserAgent };

                // Sign JWT token
                const signOptions = expireJwtToken ? { expiresIn: expireJwtToken } : undefined;
                const signedJWTToken = jwt.sign(jwtData, jwtTokenValue, signOptions);

                // Hash JWT token
                const hashedJWTToken = await bcrypt.hash(signedJWTToken, saltRounds);

                // Update session in the database
                await sessionsModel.updateOne(
                    { _id: id },
                    {
                        $set: { jwtToken: hashedJWTToken, expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
                        $unset: { OTP: "", OTPCount: "" }
                    }
                );

                return { signedJWTToken, message: "Login Successful!", status: 202 };
            } else {
                return { message: "Invalid OTP!", status: 400 };
            }
        }

        return { signedJWTToken: "", message: "Invalid request method!", status: 400 };

    } catch (error) {
        console.error(error);
        // Return error message with GitHub link
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

export default signInVerify;