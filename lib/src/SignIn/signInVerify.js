var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { connect2MongoDB } from "connect2mongodb";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import sessionsModel from "../../models/sessionsModel.js";
function signInVerify(username, otp, id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield connect2MongoDB();
        try {
            // Finding Session Via ID
            const getDocumentViaID = yield sessionsModel.findById(id);
            if (getDocumentViaID) {
                // Decrypting The OTP From The User
                const decryptedOTP = otp === (yield decryptPassword(getDocumentViaID === null || getDocumentViaID === void 0 ? void 0 : getDocumentViaID.OTP));
                // If userName Is Same, & OTP Is Also Same, Update The Session Fields, Else Throw An Error
                if (getDocumentViaID.userName === username.toLowerCase() && decryptedOTP) {
                    // This Will Update userVerified To True, Update ExpireAt After 10 Days, Remove OTP & OTPCount Fields Too
                    const updatedDocument = yield sessionsModel.findByIdAndUpdate(id, { userVerified: true, $unset: { OTP: 1, OTPCount: 1 }, $set: { expireAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) } }, { new: true });
                    return {
                        status: 202,
                        message: "Account Verified",
                    };
                }
                else {
                    return {
                        status: 400,
                        message: "Wrong OTP",
                    };
                }
            }
            else {
                // Handle the case where getDocumentViaID is null
                console.error("Document not found for the specified ID");
                return {
                    status: 404,
                    message: "Document not found",
                };
            }
        }
        catch (error) {
            return {
                status: 400,
                message: "No Accounts Were Found To Verify",
            };
        }
    });
}
export default signInVerify;
