import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//! Function to fetch all environment variable
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is undefined.`);
    }
    return value;
}

//! Fethcing  & verifying environment variables
const jwtTokenValue = getEnvVariable('JWT_TOKEN_VALUE');

//! Interface for JWTTokendata
interface JWTTokenData {
    userName: string;
    userAgent: string;
}

async function localSessionCheck(username: string, jwtToken: string, userAgent: string) {

    // Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

    try {

        //! Checking If username, & jwtToken Is Passed By Client Or Not
        if (!username || !jwtToken) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Decrypting the JWTTokendata
        const decryptingJWTTokenData = jwt.verify(jwtToken, jwtTokenValue) as JWTTokenData;

        //! Check if decrypted data matches the values
        if (decryptingJWTTokenData.userName === username && await bcrypt.compare(userAgent, decryptingJWTTokenData.userAgent)) {
            return { status: 202, message: "Session exists.", userName: username.toLowerCase() };
        }

        return { status: 400, message: "Session doesn't exist.", };

    } catch (error) {

        return { status: 400, message: "Session doesn't exist.", };

    }
}

export default localSessionCheck;