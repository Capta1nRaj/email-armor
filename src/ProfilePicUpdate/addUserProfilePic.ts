import { connect2MongoDB } from "connect2mongodb";
import serverSessionCheck from "../SessionCheck/serverSessionCheck.js";

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

async function addUserProfilePic(userName: string, id: string, jwtToken: string, userAgent: string, imageLink: string) {
    try {

        //! Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

        //! Checking If userName Is Passed By Client Or Not
        if (!userName || !id || !jwtToken) { return { status: 400, message: "Session doesn't exist.", }; }

        if (!imageLink) { return { status: 400, message: "Please provide image link.", }; }

        //! Check session, if don't exist, then, throw an error
        const checkServerSession = await serverSessionCheck(userName, id, jwtToken, userAgent);
        if (checkServerSession.status !== 202) { return { status: 400, message: "Session doesn't exist.", }; }

        //! Connecting to MognoDB
        await connect2MongoDB();

        //! Adding imageLink in the user document
        const returnOldImageLink = await accountsModel.findOneAndUpdate({ userName: userName.toLowerCase() }, { userProfilePic: imageLink }).select('userProfilePic');

        return { status: 200, message: "Image uploaded successfully.", oldImageLink: returnOldImageLink.userProfilePic || "" };

    } catch (error) {

        return {
            status: 400,
            message: "Session doesn't exist.",
        };

    }
}

export default addUserProfilePic;