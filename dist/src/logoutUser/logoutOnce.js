var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import { connect2MongoDB } from "connect2mongodb";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import sessionsModel from "../../models/sessionsModel.js";
import fetchUserIP from "../utils/fetchUserIP.js";
function logoutOnce(username, token, id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield connect2MongoDB();
        try {
            // Finding User Sessions By Id
            const findUserSession = yield sessionsModel.findById(id);
            // If Session Is Null Means No Session Exist In DB, Then, Client Will Receive This Response
            if (findUserSession.length === null) {
                return {
                    status: 400,
                    message: "No Session Found.",
                };
            }
            // Decrypting User IP
            const userIPDecrypted = yield decryptPassword(findUserSession.userIP);
            // Fetching User IP
            const userIP = yield fetchUserIP();
            // If Current Session Exist In DB, Then, Delete That Specific Session
            if (findUserSession.userName === username.toLowerCase() && findUserSession.token === token && userIPDecrypted === userIP) {
                yield sessionsModel.findByIdAndDelete(id);
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
        }
        catch (error) {
            return {
                status: 400,
                message: "Data Not Valid.",
            };
        }
    });
}
export default logoutOnce;
