import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../../models/userAccountsModel.js";

async function checkUniqueEmail(userEmail: string) {
    try {
        //! Connecting to MognoDB
        await connect2MongoDB();

        //! Checking if userEmail already exist or not
        const isUserEmailExist = await userAccountsModel.exists({ userEmail });

        //! If userEmail null, means its available
        if (!isUserEmailExist) { return { status: 200, message: "Email available!" }; }

        return { status: 400, message: "Email already exist." };

    } catch (error) {
        console.error(error);
        return { status: 400, message: "Please contact admin!" };
    }
}

export default checkUniqueEmail;