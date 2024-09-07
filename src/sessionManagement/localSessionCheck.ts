// Basic imports
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Function to fetch the value of an environment variable
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) { throw new Error(`${key} is undefined.`); }
    return value;
}

// Fetching and verifying the JWT token secret from environment variables
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');

// Interface defining the structure of JWT token data
interface JWTTokenData {
    userName: string;
    userAgent: string;
}

async function localSessionCheck(username: string, jwtToken: string, userAgent: string) {

    // Ensure the user is using a valid device, not a tool like Postman
    if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

    try {

        // Validate that both username and JWT token are provided by the client
        if (!username || !jwtToken) { return { status: 400, message: "Session doesn't exist." }; }

        // Decode and verify the JWT token using the secret key
        const decryptingJWTTokenData = jwt.verify(jwtToken, jwtTokenValue) as JWTTokenData;

        // Compare the decoded token data with the provided username and userAgent
        if (decryptingJWTTokenData.userName === username && await bcrypt.compare(userAgent, decryptingJWTTokenData.userAgent)) {
            return { status: 202, message: "Session exists.", userName: username.toLowerCase() };
        }

        // Return an error if the session data doesn't match
        return { status: 400, message: "Session doesn't exist." };

    } catch (error) {
        console.error(error);
        // Returning a message with a link to raise a PR on GitHub in case of a server error
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

export default localSessionCheck;