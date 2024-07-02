import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../../models/userAccountsModel.js";
import serverSessionCheck from "../../SessionCheck/serverSessionCheck.js";
import sessionsModel from "../../../models/sessionsModel.js";
import sendOTPToUser from "../../utils/sendOTPToUser.js";
import randomStringGenerator from "../../utils/randomStringGenerator.js";

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
import otpModel from "../../../models/otpModel.js";
import settingsModel from "../../../models/settingsModel.js";
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

async function changeUserEmail(userName: string, oldUserEmail: string, newUserEmail: string, id: string, jwtToken: string, userAgent: string, userIP: string, otp?: string) {
    try {

        // Connecting to MognoDB
        await connect2MongoDB();

        // Check session, if don't exist, then, throw an error
        const checkServerSession = await serverSessionCheck(userName, id, jwtToken, userAgent);
        if (checkServerSession.status !== 202) { return { status: 400, message: "Session doesn't exist.", }; }

        if (!otp) {

            // Generating userOTP Of Length 6
            const userOTP = await randomStringGenerator(6);

            // Encrypting The User OTP
            const encryptedOTP = await bcrypt.hash(userOTP, saltRounds);

            const checkIfOTPExistOrNot = await otpModel.findOne({ userName: userName.toLowerCase() }).select('OTPCount');

            if (checkIfOTPExistOrNot) {
                //! Check If OTP Limit Is Exceeded Or Not
                //! If Exceeded Then Don't Generate More OTP
                //! It Will Fetch Settings, & Get The OTP Limits Values From The DB
                const fetchSettings = await settingsModel.findOne({}).select('otp_limits');
                if (checkIfOTPExistOrNot.OTPCount >= fetchSettings.otp_limits) {
                    return { status: 403, message: "Max OTP Limit Reached, Please Try After 10 Minutes." };
                }

                await otpModel.updateOne({ userName: userName.toLowerCase() }, { $set: { OTP: encryptedOTP }, $inc: { OTPCount: 1 } });
            } else {
                await new otpModel({ userName: userName.toLowerCase(), OTP: encryptedOTP, }).save();
            }

            // Sending OTP To User
            await sendOTPToUser(userName, oldUserEmail, userOTP, 'emailChange', userIP, userAgent);

            return { status: 201, message: "OTP sent to your email." };

        }

        // Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

        // Checking If oldUserEmail, & other data is passed By Client Or Not
        if (!oldUserEmail || !newUserEmail || !id || !jwtToken || !userIP || !otp) { return { status: 400, message: "Please provide given values as per the docs!" }; }

        // Checking if newUserEmail already exist or not
        const isUserEmailExist = await userAccountsModel.findOne({ userEmail: newUserEmail }).select('_id');

        //! If newUserEmail exists, means its unavailable
        if (isUserEmailExist) { return { status: 400, message: "Email already exist." }; }

        // Find the OTP
        const findUserOTP = await otpModel.findOne({ userName: userName.toLowerCase() });
        if (!findUserOTP) { return { status: 400, message: "OTP not found!", }; }

        // Comparing the OTP
        const comparingOTP = await bcrypt.compare(otp, findUserOTP.OTP);
        if (!comparingOTP) { return { status: 400, message: "Invalid OTP!", }; }

        // If newUserEmail doesn't exist, means its available, so we will change the oldUserEmail with the newUserEmail
        await userAccountsModel.updateOne({ userEmail: oldUserEmail }, { $set: { userEmail: newUserEmail } });

        //! Deleteing all the old serverSession data once userEmail is changed successfully
        const deleteExistingSession = await sessionsModel.findByIdAndDelete(id).select('userName');
        //! Also delete all session related to it
        await sessionsModel.deleteMany({ userName: deleteExistingSession.userName });

        // If OTP is valid, then delete the OTP
        await otpModel.deleteOne({ userName: userName.toLowerCase() });

        return { status: 200, message: "Email changed successfully." };

    } catch (error) {
        console.error(error);
        return { status: 400, message: "Please contact admin!" };
    }
}

export default changeUserEmail;