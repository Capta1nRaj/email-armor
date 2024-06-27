import { connect2MongoDB } from "connect2mongodb";
import serverSessionCheck from "../SessionCheck/serverSessionCheck.js";
import userAccountsModel from "../../models/userAccountsModel.js";

async function removeProfilePic(userName: string, id: string, jwtToken: string, userAgent: string) {
    try {

        //! Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

        //! Checking If userName Is Passed By Client Or Not
        if (!userName || !id || !jwtToken) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Check session, if don't exist, then, throw an error
        const checkServerSession = await serverSessionCheck(userName, id, jwtToken, userAgent);
        if (checkServerSession.status !== 202) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Connecting to MognoDB
        await connect2MongoDB();

        //! Adding imageLink in the user document
        const imageLink = await userAccountsModel.findOneAndUpdate({ userName: userName.toLowerCase() }, { $unset: { userProfilePic: "" } }).select('userProfilePic');

        return { status: 200, message: "Image uploaded successfully.", imageLink: imageLink.userProfilePic || "" };

    } catch (error) {

        return {
            status: 400,
            message: "Session doesn't exist.",
        };

    }
}

export default removeProfilePic;