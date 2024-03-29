import { connect2MongoDB } from "connect2mongodb";
import sessionsModel from "../../models/sessionsModel.js";
import fetchUserIP from "../utils/fetchUserIP.js";
import bcrypt from 'bcrypt';

async function logoutOnce(username: string, token: any, id: any) {

    await connect2MongoDB();

    try {

        // Finding User Sessions By Id
        const findUserSession = await sessionsModel.findById(id).select('userName userIP token');

        // If Session Is Null Means No Session Exist In DB, Then, Client Will Receive This Response
        if (findUserSession.length === null) {
            return {
                status: 400,
                message: "No Session Found.",
            };
        }

        // Fetching User IP
        const userIP = await fetchUserIP();

        // Decrypting User IP
        const userIPDecrypted = await bcrypt.compare(userIP, findUserSession.userIP);

        // If Current Session Exist In DB, Then, Delete That Specific Session
        if (findUserSession.userName === username.toLowerCase() && findUserSession.token === token && userIPDecrypted === userIP) {
            await sessionsModel.deleteOne({ _id: id });
            return {
                status: 200,
                message: "User Session Deleted.",
            };
        }

        // If Not Exist In DB, Then, Client Will Receive This Response
        return {
            status: 400,
            message: "Data Not Valid.",
        };

    } catch (error) {
        return {
            status: 400,
            message: "Data Not Valid.",
        };
    }
}

export default logoutOnce;