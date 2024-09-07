import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import bcrypt from 'bcrypt';

async function logoutAll(id: string, userName: string, userAgent: any, jwtToken: any) {

    // Connecting to MongoDB
    await connect2MongoDB();

    try {
        // Find the user session by session ID and populate the associated user account data
        const findUserSession = await sessionsModel.findById(id)
            .select('_id userName userAgent jwtToken')
            .populate({ path: "userName", model: "userAccounts", select: "userName" });

        // If no session is found, inform the client that no session exists in the database
        if (!findUserSession) {
            return { message: "No active session found for this user.", status: 400 };
        }

        // Compare the JWT token from the client with the hashed token in the database
        const comparingJWTToken = await bcrypt.compare(jwtToken, findUserSession.jwtToken);

        // Validate if the user agent from the client matches the one stored in the session
        const checkIfUserAgentValid = findUserSession.userAgent === userAgent;

        // Ensure that the username from the client matches the one stored in the database (case-insensitive)
        const comparingUserName = findUserSession.userName.userName === userName.toLowerCase();

        // If all checks pass (username, user agent, JWT token), delete all sessions for the user
        if (comparingUserName && checkIfUserAgentValid && comparingJWTToken) {
            await sessionsModel.deleteMany({ userName: findUserSession.userName._id });
            return { message: "Logout successful.", status: 200 };
        }

        // If validation fails, return a message indicating invalid session data
        return { message: "Invalid session data provided. Unable to delete sessions.", status: 400 };

    } catch (error) {
        console.log(error);
        // Returning a message with a link to raise a PR on GitHub in case of a server error
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }
}

export default logoutAll;