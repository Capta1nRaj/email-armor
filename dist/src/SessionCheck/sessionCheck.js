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
import sessionsModel from "../../models/sessionsModel.js";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import fetchUserIP from "../utils/fetchUserIP.js";
function sessionCheck(username, token, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Checking If username, Token, & id Is Passed By Client Or Not
            if (username.toLowerCase() === undefined || token === undefined || id === undefined || username.toLowerCase().length === 0 || token.length === 0) {
                return {
                    status: 204,
                    message: "Please Provide Username, Token, & Id",
                };
            }
            // Connection To MongoDB
            yield connect2MongoDB();
            // Find User Session Using ID
            const findSessionUsingUserID = yield sessionsModel.findById(id);
            // If No Session Exist In DB, Client Will Receive This Response
            if (findSessionUsingUserID === null) {
                return {
                    status: 400,
                    message: "Session doesn't exist.",
                };
            }
            // Decrypting User IP
            const userIPDecrypted = yield decryptPassword(findSessionUsingUserID.userIP);
            // Fetching User IP
            const userIP = yield fetchUserIP();
            if (findSessionUsingUserID.userName === username.toLowerCase() && findSessionUsingUserID.token === token && userIPDecrypted === userIP && findSessionUsingUserID.userVerified === true) {
                return {
                    status: 202,
                    message: "Session exists.",
                    userName: username.toLowerCase()
                };
            }
            else {
                return {
                    status: 400,
                    message: "Session doesn't exist.",
                };
            }
        }
        catch (error) {
            return {
                status: 400,
                message: "Session doesn't exist.",
            };
        }
    });
}
export default sessionCheck;
