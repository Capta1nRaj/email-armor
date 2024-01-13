import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

//! Checking if JWT_TOKEN_VALUE is a defined or not
//! Checking if EXPIRE_JWT_TOKEN value is a defined or not
import jwt from 'jsonwebtoken';
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined || value.length === 0) {
        throw new Error(`${key} is undefined.`);
    }
    return value;
}

// Retrieve environment variables
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');
let expireJwtToken: string | null = getEnvVariable('EXPIRE_JWT_TOKEN');

if (expireJwtToken === '0') {
    expireJwtToken = null;
}

async function signInVerify(username: string, otp: string, id: string, userAgent: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) {
        return {
            status: 401,
            message: "Your device is unauthorized."
        };
    }

    await connect2MongoDB();

    try {

        // Finding Session Via ID
        const getDocumentViaID = await sessionsModel.findById(id).select('userName OTP');

        // Decrypting The OTP From The User
        const decryptedOTP = await bcrypt.compare(otp, getDocumentViaID.OTP);

        // If userName Is Same, & OTP Is Also Same, Update The Session Fields, Else Throw An Error
        if (getDocumentViaID.userName === username.toLowerCase() && decryptedOTP === true) {

            // This Will Update userVerified To True, Update ExpireAt After 10 Days, Remove OTP & OTPCount Fields Too
            const userData = await sessionsModel.findByIdAndDelete(id).select('userName');

            // Encrypting userAgent
            const enccryptedUserAgent = await bcrypt.hash(userAgent, saltRounds)

            // JWT Token data
            const jwtData = {
                userName: userData.userName,
                userAgent: enccryptedUserAgent
            }

            // Signing JWT Token with jwtTokenValue & expiry date
            const signOptions = expireJwtToken ? { expiresIn: expireJwtToken } : undefined;
            const signedJWTToken = jwt.sign(jwtData, jwtTokenValue, signOptions);

            // Sending JWT Token to user
            return {
                status: 202,
                message: "Account Verified",
                signedJWTToken
            }

        } else {

            return {
                status: 400,
                message: "Wrong OTP"
            }

        }

    } catch (error) {

        return {
            status: 400,
            message: "No Accounts Were Found To Verify",
        };

    }
}

export default signInVerify;