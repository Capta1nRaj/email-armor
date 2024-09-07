// Basic Imports
import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../models/userAccountsModel.js";
import otpModel from "../../models/otpModel.js";
import bcrypt from 'bcrypt';

// Checking if BCRYPT_SALT_ROUNDS is a valid number from environment variables
let saltRounds: number;
if (process.env.BCRYPT_SALT_ROUNDS === undefined || process.env.BCRYPT_SALT_ROUNDS.length === 0 || (Number.isNaN(Number(process.env.BCRYPT_SALT_ROUNDS)))) {
    throw new Error("BCRYPT_SALT_ROUNDS is either undefined or not a valid number");
} else {
    saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
}

async function updatePassword(userEmail: string, userName: string, userAgent: string, OTP: string, newPassword: string) {

    // Check if the request is coming from a valid user device, not a tool like Postman
    if (!userAgent) { return { message: "Your device is unauthorized.", status: 401 }; }

    // Ensure that either userName or userEmail is provided
    if (!userName && !userEmail) { return { message: "Either userName or userEmail must be provided!", status: 400 }; }

    // Ensure OTP is provided
    if (!OTP) { return { message: "OTP is required!", status: 400 }; }

    // Ensure the new password is provided
    if (!newPassword) { return { message: "New password is required!", status: 400 }; }

    // Validate userName format if provided
    if (userName) {
        if (!/^[a-zA-Z0-9_]+$/.test(userName)) {
            return { message: "Invalid userName!", status: 400 };
        }
    }

    // Validate userEmail format if provided
    if (userEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            return { message: "Invalid Email!", status: 400 };
        }
    }

    try {
        // Establish a connection to MongoDB
        await connect2MongoDB();

        // Look for the user by userName or userEmail in the database
        const findUserToLogin = await userAccountsModel.findOne({
            $or: [{ userName: userName.toLowerCase() }, { userEmail: userEmail.toLowerCase() }]
        }).select('_id userName userEmail');

        // If user is not found, return an error
        if (!findUserToLogin) { return { message: "Please Validate Your Details.", status: 400 }; }

        // Fetch OTP record for the user from the database
        const otpData = await otpModel.findOne({ userName: findUserToLogin.userName }).select('OTP');

        // If OTP is not found (likely expired), return an error
        if (!otpData) { return { message: "OTP is expired!", status: 400 }; }

        // Compare the provided OTP with the stored hashed OTP using bcrypt
        const decryptedOTP = await bcrypt.compare(OTP as string, otpData.OTP);

        // If OTP validation fails, return an error
        if (!decryptedOTP) { return { message: "Invalid OTP!", status: 400 }; }

        // Update the user's password with the new hashed password
        await userAccountsModel.updateOne({ userName: findUserToLogin.userName }, { $set: { userPassword: await bcrypt.hash(newPassword, saltRounds) } });

        // Delete the OTP record after successful password update
        await otpModel.deleteOne({ userName: findUserToLogin.userName });

        // Return a success message indicating password update was successful
        return { message: "Password updated successfully!", status: 201 };

    } catch (error) {
        console.error(error);
        // Return a generic error message in case of a server-side failure
        return { message: "An unexpected error occurred. Please report this issue at https://github.com/Capta1nRaj/email-armor", status: 500 };
    }

}

export default updatePassword;