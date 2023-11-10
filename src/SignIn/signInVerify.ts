import { connect2MongoDB } from "connect2mongodb";
import decryptPassword from "../PasswordHashing/decryptPassword.js";
import sessionsModel from "../../models/sessionsModel.js";

async function signInVerify(username: string, otp: string, id: string) {
  await connect2MongoDB();

  try {
    // Finding Session Via ID
    const getDocumentViaID = await sessionsModel.findById(id);

    if (getDocumentViaID) {
      // Decrypting The OTP From The User
      const decryptedOTP = otp === (await decryptPassword(getDocumentViaID?.OTP));

      // If userName Is Same, & OTP Is Also Same, Update The Session Fields, Else Throw An Error
      if (getDocumentViaID.userName === username.toLowerCase() && decryptedOTP) {
        // This Will Update userVerified To True, Update ExpireAt After 10 Days, Remove OTP & OTPCount Fields Too
        const updatedDocument = await sessionsModel.findByIdAndUpdate(id, { userVerified: true, $unset: { OTP: 1, OTPCount: 1 }, $set: { expireAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) } }, { new: true });

        return {
          status: 202,
          message: "Account Verified",
        };

      } else {

        return {
          status: 400,
          message: "Wrong OTP",
        };

      }

    } else {

      // Handle the case where getDocumentViaID is null
      console.error("Document not found for the specified ID");
      return {
        status: 404,
        message: "Document not found",
      };
    }

  } catch (error) {

    return {
      status: 400,
      message: "No Accounts Were Found To Verify",
    };
    
  }
}

export default signInVerify;
