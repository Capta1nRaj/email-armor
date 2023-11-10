import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import fetchUserIP from "../fetchUserIP";

async function sessionCheck(username: string, token: string, id: string) {

    try {

        // Checking If username, Token, & id Is Passed By Client Or Not
        if (username.toLowerCase() === undefined || token === undefined || id === undefined || username.toLowerCase().length === 0 || token.length === 0) {
            return {
                status: 204,
                message: "Please Provide Username, Token, & Id",
            };
        }

        // Connection To MongoDB
        await connect2MongoDB();

        // Find User Session Using ID
        const findSessionUsingUserID = await sessionsModel.findById(id)

        // If No Session Exist In DB, Client Will Receive This Response
        if (findSessionUsingUserID === null) {

            return {
                status: 400,
                message: "Session doesn't exist.",
            };

        }

        // Decrypting User IP
        const userIPDecrypted = await decryptPassword(findSessionUsingUserID.userIP);
        // Fetching User IP
        const userIP = await fetchUserIP();

        if (findSessionUsingUserID.userName === username.toLowerCase() && findSessionUsingUserID.token === token && userIPDecrypted === userIP && findSessionUsingUserID.userVerified === true) {
            return {
                status: 202,
                message: "Session exists.",
                userName: username.toLowerCase()
            };

        } else {

            return {
                status: 400,
                message: "Session doesn't exist.",
            };

        }

    } catch (error) {

        return {
            status: 400,
            message: "Session doesn't exist.",
        };

    }
}

export default sessionCheck;