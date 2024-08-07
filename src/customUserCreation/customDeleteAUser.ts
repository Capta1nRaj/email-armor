import { connect2MongoDB } from "connect2mongodb";
import userAccountsModel from "../../models/userAccountsModel.js";

async function customDeleteAUser(userName: string) {

    try {

        await connect2MongoDB();

        // Deleting user from db
        const deletingUser = await userAccountsModel.findOneAndDelete({ userName }).select('_id');

        // Deleteing the userName from the referred users userReferrals docuemnt
        await userAccountsModel.findOneAndUpdate({ _id: deletingUser._id }, { $pull: { userReferrals: deletingUser._id } });

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
