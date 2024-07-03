import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../../models/userAccountsModel.js";
import serverSessionCheck from "../../SessionCheck/serverSessionCheck.js";
import sessionsModel from "../../../models/sessionsModel.js";

async function changeUsername(oldUsername: string, newUsername: string, id: string, jwtToken: string, userAgent: string) {
    try {
        //! Checking if user is trying to hit the API with a software like Postman
        if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

        //! Checking If oldUsername, & other data is passed By Client Or Not
        if (!oldUsername || !id || !jwtToken) { return { status: 400, message: "Session doesn't exist." }; }

        //! Connecting to MognoDB
        await connect2MongoDB();

        //! Checking if newUsername already exist or not
        const isUsernameExist = await userAccountsModel.exists({ userName: newUsername });

        //! If newUsername exists, means its unavailable
        if (isUsernameExist) { return { status: 400, message: "Username already exist." }; }

        //! Check session, if don't exist, then, throw an error
        const checkServerSession = await serverSessionCheck(oldUsername, id, jwtToken, userAgent);
        if (checkServerSession.status !== 202) { return { status: 400, message: "Session doesn't exist.", }; }

        //! If newUsername doesn't exist, means its available, so we will change the oldUsername with the newUsername data
        const oldUsernameID = await userAccountsModel.findOneAndUpdate({ userName: oldUsername }, { $set: { userName: newUsername } }).select('_id');

        //! Deleteing all the old serverSession data once userName is changed successfully
        await sessionsModel.deleteMany({ userName: oldUsernameID._id });

        return { status: 200, message: "Username changed successfully." };

    } catch (error) {
        console.error(error);
        return { status: 400, message: "Please contact admin!" };
    }
}

export default changeUsername;