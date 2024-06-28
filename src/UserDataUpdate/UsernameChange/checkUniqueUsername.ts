import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../../models/userAccountsModel.js";

async function checkUniqueUsername(userName: string) {
    try {
        //! Connecting to MognoDB
        await connect2MongoDB();

        //! Checking if userName already exist or not
        const isUsernameExist = await userAccountsModel.exists({ userName });

        //! If userName null, means its available
        if (!isUsernameExist) { return { status: 400, message: "Username available!" }; }

        return { status: 400, message: "Username already exist." };

    } catch (error) {
        console.error(error);
        return { status: 400, message: "Please contact admin!" };
    }
}

export default checkUniqueUsername;