// Basic imports
import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import bcrypt from 'bcrypt';

async function logoutOnce(id: string, userName: string, userAgent: any, jwtToken: any) {

    // Connecting to MongoDB
    await connect2MongoDB();

    try {
        // Find user session by session ID and populate the associated user account data
        const findUserSession = await sessionsModel.findById(id)
            .select('_id userName userAgent jwtToken')
            .populate({ path: "userName", model: "userAccounts", select: "userName" });

        // If no session is found in the database, inform the client that no active session exists
        if (!findUserSession) { return { message: "No active session found for this user.", status: 400 } }

        // Compare the JWT token from the client with the hashed token in the database
        const comparingJWTToken = await bcrypt.compare(jwtToken, findUserSession.jwtToken);

        // Validate if the user agent from the client matches the one stored in the session
        const checkIfUserAgentValid = findUserSession.userAgent === userAgent;

        // Ensure that the userName from the client matches the one stored in the database (case-insensitive)
        const compringUserName = findUserSession.userName.userName === userName.toLowerCase();

        // If all checks pass (userName, user agent, JWT token), delete the session from the database
        if (compringUserName && checkIfUserAgentValid && comparingJWTToken) {
            await sessionsModel.deleteOne({ _id: id });
            return { message: "Logout successful.", status: 200 };
        }

        // If validation fails, return a message indicating invalid credentials or session data
        return { message: "Invalid session data provided.", status: 400 };

    } catch (error) {
        console.error(error);
        // Returning a message with a link to raise a PR on GitHub in case of a server error
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

export default logoutOnce;
