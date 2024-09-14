// Basic imports
import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userAccountsModel from '../../models/userAccountsModel.js';
import { config } from 'dotenv';
import { sendSignInOTP } from "./utils/sendSignInOTP.js";
config();

// Checking if BCRYPT_SALT_ROUNDS is a number or not
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

// Retrieving jwt environment variables
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined || value.length === 0) { throw new Error(`${key} is undefined.`); }
    return value;
}
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');
let expireJwtToken: string | null = getEnvVariable('EXPIRE_JWT_TOKEN');
if (expireJwtToken === '0') { expireJwtToken = null }

async function signIn(userEmail: string, userName: string, userPassword: string | boolean, userAgent: string, userIP: string) {
    try {

        // Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { message: "Your device is unauthorized.", status: 401 }; }

        // If both userName and userEmail are undefined, throw an error
        if (!userName && !userEmail) { return { message: "Either userName or userEmail must be provided!", status: 400 }; }

        // Validating userName format if exist
        if (userName) {
            const regexForuserName = /^[a-zA-Z0-9_]+$/;
            if (!regexForuserName.test(userName)) { return { message: "Invalid userName!", status: 400 }; }
        }

        // Validating userEmail address format if exist
        if (userEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userEmail)) { return { message: "Invalid Email!", status: 400 }; }
        }

        // Connecting to MongoDB
        await connect2MongoDB();

        // Validating if user exist
        const findUserToLogin = await userAccountsModel.findOne({
            $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }]
        }).select('_id userVerified userName userEmail userPassword twoStepVerification');

        // If user not found, throw error
        if (!findUserToLogin) { return { message: "Please Validate Your Details.", status: 400 }; }

        // Validating password
        const decryptedPassword = await bcrypt.compare(userPassword as string, findUserToLogin.userPassword)

        // If incorrect password, throw error
        if (!decryptedPassword) { return { message: "Please Validate Your Details.", status: 400 }; }

        const validatUserName = findUserToLogin.userName === userName.toLowerCase();
        const validateUserEmail = findUserToLogin.userEmail === userEmail;
        // Verifying if the provided userName and userPassword match the clients input
        if ((validatUserName || validateUserEmail) && decryptedPassword) {

            // If twoStepVerification is enabled, then, send an email
            // else login directly
            if (findUserToLogin.twoStepVerification) {

                // Sending OTP mail to user, & getting hashed OTP in return to store in DB
                const hashingOTP = await sendSignInOTP(findUserToLogin.userEmail, findUserToLogin.userName, userIP, userAgent);

                // Saving session in DB
                const sessionID = await new sessionsModel({
                    userName: findUserToLogin._id,
                    userAgent: userAgent,
                    OTP: hashingOTP,
                    OTPCount: 0
                }).save();

                return { id: sessionID._id, userName: findUserToLogin.userName.toLowerCase(), message: "OTP has been sent to your email!", status: 201 };
            } else {
                // Hasing userAgent
                const hashingUserAgent = await bcrypt.hash(userAgent, saltRounds)

                // JWT Token data
                const jwtData = { userName: findUserToLogin.userName.toLowerCase(), userAgent: hashingUserAgent }

                // Signing JWT Token with jwtTokenValue & expiry date
                const signOptions = expireJwtToken ? { expiresIn: expireJwtToken } : undefined;
                const signedJWTToken = jwt.sign(jwtData, jwtTokenValue, signOptions);

                // Encrypting jwtToken
                const hashingJWTToken = await bcrypt.hash(signedJWTToken, saltRounds)

                // Storing the session model in the DB with an expiration set to 1 year from now
                const sessionID = await new sessionsModel({
                    userName: findUserToLogin._id,
                    userAgent: userAgent,
                    jwtToken: hashingJWTToken,
                    expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }).save();

                return { id: sessionID._id, userName: findUserToLogin.userName.toLowerCase(), signedJWTToken: signedJWTToken, message: "Login Successful!", status: 202 };
            }
        } else {
            return { message: "Please Validate Your Details.", status: 400 };
        }
    } catch (error) {
        console.error(error)
        // Returning a message with a link to raise a PR on GitHub in case of a server error
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

export default signIn;
