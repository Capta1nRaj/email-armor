import { connect2MongoDB } from "connect2mongodb";
import decryptPassword from "../PasswordHashing/decryptPassword.mjs";
import sessionsModel from "../../models/sessionsModel.mjs";
import fetchUserIP from "./utils/fetchUserIP.mjs";

async function logoutAll(username, token, id) {

    await connect2MongoDB();

    try {

        // Finding User Sessions By Id
        const findUserSession = await sessionsModel.findById(id);

        // If Session Is Null Means No Session Exist In DB, Then, Client Will Receive This Response
        if (findUserSession.length === null) {
            return {
                status: 400,
                message: "No Session Found.",
            };
        }

        // Decrypting User IP
        const userIPDecrypted = await decryptPassword(findUserSession.userIP);

        // Fetching User IP
        const userIP = await fetchUserIP();

        // If Current Session Exist In DB, Then, Delte All The Sessions Which Have The username In It
        if (findUserSession.userName === username.toLowerCase() && findUserSession.token === token && userIPDecrypted === userIP) {
            await sessionsModel.deleteMany({ userName: username.toLowerCase() });
            return {
                status: 200,
                message: "All Of The User's Session Deleted.",
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

export default logoutAll;