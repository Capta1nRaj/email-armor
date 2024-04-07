import bcrypt from 'bcrypt';
import sessionsModel from '../../models/sessionsModel.js';
import { connect2MongoDB } from 'connect2mongodb';

//! Function to fetch all environment variable
function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is undefined.`);
    }
    return value;
}

async function serverSessionCheck(username: string, id: string, jwtToken: string, userAgent: string) {

    //! Checking if user is trying to hit the API with a software like Postman
    if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

    try {

        //! Checking If username, & jwtToken Is Passed By Client Or Not
        if (!id || !jwtToken || !username) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Connecting to MognoDB 
        await connect2MongoDB();

        //! Find if session exist in DB or not
        const findSessionById = await sessionsModel.findById(id);

        //! If not, then, throw error
        if (!findSessionById) return { status: 400, message: "Session doesn't exist.", };

        //! Comparing the JWTTokendata & User Agent
        const checkIfJWTTokenValid = await bcrypt.compare(jwtToken, findSessionById.jwtToken);
        const checkIfUserAgentValid = findSessionById.userAgent === userAgent;

        //! Check if decrypted data matches the values
        if (checkIfJWTTokenValid && checkIfUserAgentValid) {
            return { status: 202, message: "Session exists.", userName: username.toLowerCase() };
        }

        return { status: 400, message: "Session doesn't exist." };

    } catch (error) {

        return {
            status: 400,
            message: "Session doesn't exist.",
        };

    }
}

export default serverSessionCheck;