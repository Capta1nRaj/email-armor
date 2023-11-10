import mongoose, { Document, Model } from "mongoose";

const dynamicAccountsModel = (modelName = 'accounts') => {
    interface AccountsModel extends Document {
        userFullName: string;
        userName: string;
        userEmail: string;
        userPassword: string;
        userMobileNumber?: string;
        userPic: string;
        userReferralCode: string;
        userReferrals: string[];
        userReferredBy: string;
        userVerified: boolean;
        points: number;
    }

    const AccountsSchema = new mongoose.Schema<AccountsModel>({
        userFullName: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
            unique: true,
        },
        userEmail: {
            type: String,
            required: true,
            unique: true,
        },
        userPassword: {
            type: String,
            required: true,
        },
        userMobileNumber: {
            type: String,
        },
        userPic: {
            type: String,
            default: ""
        },
        userReferralCode: {
            type: String,
            required: true,
            unique: true,
        },
        userReferrals: {
            type: [String],
            default: [],
        },
        userReferredBy: {
            type: String,
            default: "",
        },
        userVerified: {
            type: Boolean,
            default: false,
        },
        points: {
            type: Number,
            default: 0,
        }
    }, {
        timestamps: true
    });

    AccountsSchema.index({ userName: 1 }, { unique: true });
    AccountsSchema.index({ userEmail: 1 }, { unique: true });
    AccountsSchema.index({ userReferralCode: 1 }, { unique: true });
    AccountsSchema.index({ userReferredBy: 1 });
    AccountsSchema.index({ userMobileNumber: 1 });

    return mongoose.models[modelName] || mongoose.model<AccountsModel>(modelName, AccountsSchema);
};

export default dynamicAccountsModel;