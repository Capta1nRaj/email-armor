import { connect2MongoDB } from "connect2mongodb";

//! Generating A Dynamic Account Model Name If User Needs
//! If User Wants A Dynamic Model, Then, Add ACCOUNT_MODEL_NAME & Your Model Name
import dynamicAccountsModel from "../../models/accountsModel.js";
var accountsModel = dynamicAccountsModel();
if (process.env.ACCOUNTS_MODEL_NAME !== undefined) {
    accountsModel = dynamicAccountsModel(process.env.ACCOUNTS_MODEL_NAME);
}

async function customDeleteAUser(userName: string) {

    try {

        await connect2MongoDB();

        // Deleting user from db
        const deletingUser = await accountsModel.findOneAndDelete({ userName }).select('userReferredBy');

        // Deleteing the userName from the referred users userReferrals docuemnt
        await accountsModel.findOneAndUpdate({ userName: deletingUser.userReferredBy }, { $pull: { userReferrals: userName } });

        return {
            status: 200,
            message: "User deleted successfully.",
            deletingUser
        };

    } catch (error) {
        return {
            status: 401,
            message: "Is this Mr. Developer or someone trying to.... uh?",
        };
    }
}

export default customDeleteAUser;
