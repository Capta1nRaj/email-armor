import serverSessionCheck from "../SessionCheck/serverSessionCheck.js";
import otpModel from "../../models/otpModel.js";
import settingsModel from "../../models/settingsModel.js";
import sendOTPToUser from "../utils/sendOTPToUser.js";

import userAccountsModel from "../../models/userAccountsModel.js";
import randomStringGenerator from "../utils/randomStringGenerator.js";

//! Checking if BCRYPT_SALT_ROUNDS is a number or not
import bcrypt from 'bcrypt'
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("saltRounds is either undefined or a valid number")
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}


async function changePassword(userName: string, id: string, jwtToken: string, userAgent: string, userOTP: string, oldPassword: string, newPassword: string, userIP: string) {
    try {

        // Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

        //! Checking If userName Is Passed By Client Or Not
        if (!userName || !id || !jwtToken) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Check session, if don't exist, then, throw an error
        const checkServerSession = await serverSessionCheck(userName, id, jwtToken, userAgent);
        if (checkServerSession.status !== 202) { return { status: 400, message: "Session doesn't exist.", }; }

        //* If client don't send userName, then, it means, he is trying to request for a new password
        //* So we will find if ID exist or not, then, we will send the OTP
        if (!userOTP) {
            //! Finding If User Exist Or Not From DB
            const findUser = await userAccountsModel.findOne({ userName: userName.toLowerCase() }).select('userEmail userPassword');

            //! If userName Don't Exist, Return A Bad Request 
            if (!findUser) { return { status: 400, message: "Please Validate Your Details.", }; }

            //* If ID exist, then, send an OTP to the client
            //! Generating OTP
            const generateOTP = await randomStringGenerator(6);

            //! Encrypting OTP
            const encryptedOTP = await bcrypt.hash(generateOTP, saltRounds);

            //! Checking If OTP Already Exist In DB Or Not
            const checkIfOTPExistOrNot = await otpModel.findOne({ userName: userName.toLowerCase() }).select('OTPCount');

            //! If OTP Not Exist, Then, Create A New Doc & Save To DB
            if (!checkIfOTPExistOrNot) {

                await new otpModel({
                    userName: userName.toLowerCase(),
                    OTP: encryptedOTP,
                }).save();

                //! If OTP Exist, Then, Find & Update The Doc & Save To DB
            } else {

                //! Check If OTP Limit Is Exceeded Or Not
                //! If Exceeded Then Don't Generate More OTP

                //! It Will Fetch Settings, & Get The OTP Limits Values From The DB
                const fetchSettings = await settingsModel.findOne({}).select('otp_limits');
                if (checkIfOTPExistOrNot.OTPCount >= fetchSettings.otp_limits) {
                    return { status: 403, message: "Max OTP Limit Reached, Please Try After 10 Minutes." };
                }

                //! If Not Exceeded Then Generate New OTP & Increase OTPCount By 1
                await otpModel.updateOne({ userName: userName.toLowerCase() }, { $inc: { OTPCount: 1 }, OTP: encryptedOTP }, { new: true });

            }

            //! Sending OTP To User Registered E-Mail
            await sendOTPToUser(userName.toLowerCase(), findUser.userEmail, generateOTP, 'changePassword', userIP, userAgent);

            return { status: 201, message: "OTP Sent To Mail", userName: userName.toLowerCase(), };
        }

        //! If user sents OTP, they will send oldPassword and newPassword together to verify
        const fetchOTP = await otpModel.findOne({ userName: userName.toLowerCase() }).select('OTP');
        if (!fetchOTP) { return { status: 400, message: "Please Validate Your Details.", }; }

        //! Comparing the OTP 
        const compareOTP = await bcrypt.compare(userOTP, fetchOTP.OTP);

        //! If OTP Is False, Client Will Recevie This Response
        if (!compareOTP) { return { status: 400, message: "Wrong OTP" } }

        //* If OTP Is True, then, find & compare the oldPassword of the client, & if it's valid, then, update the newPassword
        const fetchOldPassword = await userAccountsModel.findOne({ userName: userName.toLowerCase() }).select('userPassword');

        //! Comparing the oldPassword
        const compareOldPassword = await bcrypt.compare(oldPassword, fetchOldPassword.userPassword);

        //! If oldPassword Is False, Client Will Recevie This Response
        if (!compareOldPassword) { return { status: 400, message: "Please Validate Your Details.", }; }

        //! Secure user password
        const encryptedPassword = await bcrypt.hash(newPassword, saltRounds)

        //* If oldPassword is True, then, hash & update the newPassword to the DB, & delete the OTP
        await userAccountsModel.updateOne({ userName: userName.toLowerCase() }, { userPassword: encryptedPassword })
        await otpModel.deleteOne({ userName: userName.toLowerCase() });

        return { status: 200, message: "Password updated successfully!" };

    } catch (error) {
        return { status: 500, message: "Internal Server Error.", error };
    }
}

export default changePassword;