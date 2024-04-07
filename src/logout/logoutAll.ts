import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import bcrypt from 'bcrypt';

async function logoutAll(id: string, username: string, userAgent: any, token: any) {

    await connect2MongoDB();

    try {
        // Finding User Sessions By Id
        const findUserSession = await sessionsModel.findById(id).select('userName userAgent jwtToken');

        // If Session Is Null Means No Session Exist In DB, Then, Client Will Receive This Response
        if (!findUserSession) { return { status: 400, message: "No Session Found.", }; }

        // Comparing the JWTTokendata & User Agent
        const comparingJWTToken = await bcrypt.compare(token, findUserSession.jwtToken);
        const checkIfUserAgentValid = findUserSession.userAgent === userAgent;
        const compringUserName = findUserSession.userName === username.toLowerCase();

        // If Current Session Exist In DB, Then, Delete That Specific Session
        if (compringUserName && checkIfUserAgentValid && comparingJWTToken) {
            await sessionsModel.deleteMany({ userName: username });
            return { status: 200, message: "All User Sessions Deleted.", };
        }

        // If Not Exist In DB, Then, Client Will Receive This Response
        return { status: 400, message: "Data Not Valid." };

    } catch (error) {
        return { status: 400, message: "Data Not Valid.", };
    }
}

export default logoutAll;