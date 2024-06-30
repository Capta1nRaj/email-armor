import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../../models/userAccountsModel.js";
import localSessionCheck from "../../SessionCheck/localSessionCheck.js";

async function removeProfilePic(userName: string, jwtToken: string, userAgent: string) {
    try {

        //! Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

        //! Checking If userName Is Passed By Client Or Not
        if (!userName || !jwtToken) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Check session, if don't exist, then, throw an error
        const checkServerSession = await localSessionCheck(userName, jwtToken, userAgent);
        if (checkServerSession.status !== 202) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Connecting to MognoDB
        await connect2MongoDB();

        //! Removing imageLink in the user document
        await userAccountsModel.updateOne({ userName: userName.toLowerCase() }, { $unset: { userProfilePic: "" } });

        return { status: 200, message: "Image removed successfully." };

    } catch (error) {

        return {
            status: 400,
            message: "Session doesn't exist.",
        };

    }
}

export default removeProfilePic;