// Basic imports for bcrypt, sessionsModel, MongoDB connection, and JWT handling
import bcrypt from 'bcrypt';
import sessionsModel from '../../models/sessionsModel.js';
import { connect2MongoDB } from 'connect2mongodb';
import jwt from 'jsonwebtoken';

// Function to fetch an environment variable and throw an error if undefined
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is undefined.`);
    }
    return value;
}

// Retrieve the JWT token secret from environment variables
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');

// Interface defining the structure of JWT token data
interface JWTTokenData {
    userName: string;
    userAgent: string;
}

async function serverSessionCheck(username: string, id: string, jwtToken: string, userAgent: string) {

    // Ensure the request comes from an authorized device (not tools like Postman)
    if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

    try {
        // Validate that session ID, JWT token, and username are provided
        if (!id || !jwtToken || !username) { return { status: 400, message: "Session doesn't exist." }; }

        // Connecting to MongoDB
        await connect2MongoDB();

        // Retrieve the session data from the database using the session ID, selecting userAgent and jwtToken
        const findSessionById = await sessionsModel.findById(id).select('userAgent jwtToken');

        // If no session is found, return an error indicating session doesn't exist
        if (!findSessionById) return { status: 400, message: "Session doesn't exist." };

        // Decode and verify the JWT token using the secret key
        const decryptingJWTTokenData = jwt.verify(jwtToken, jwtTokenValue) as JWTTokenData;

        // Check if the provided JWT token matches the hashed token stored in the database
        const checkIfJWTTokenValid = await bcrypt.compare(jwtToken, findSessionById.jwtToken);

        // Check if the provided user agent matches the one stored in the database
        const checkIfUserAgentValid = findSessionById.userAgent === userAgent;

        // If JWT token and user agent are valid, confirm session exists
        if (checkIfJWTTokenValid && checkIfUserAgentValid && decryptingJWTTokenData) {
            return { status: 202, message: "Session exists.", userName: username.toLowerCase() };
        }

        // If validation fails, return an error indicating session doesn't exist
        return { status: 400, message: "Session doesn't exist." };

    } catch (error) {
        console.log(error);
        // Return error with a link to report the issue in case of a server failure
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

export default serverSessionCheck;