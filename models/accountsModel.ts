import mongoose from "mongoose";

const dynamicAccountsModel = (modelName = 'accounts') => {
    const AccountsSchema = new mongoose.Schema({
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
        },
        userRole: {
            type: String,
        },
        userUniqueIdentification: {
            type: [String],
            default: [],
        },
        userBankDetails: {
            type: [
                {
                    bankName: {
                        type: String,
                    },
                    accountNumber: {
                        type: String,
                    },
                    ifscCode: {
                        type: String,
                    }
                }
            ],
            default: []
        },
        userAddress: {
            type: [
                {
                    addressLine1: {
                        type: String
                    },
                    addressLine2: {
                        type: String
                    },
                    landmark: {
                        type: String
                    },
                    city: {
                        type: String
                    },
                    country: {
                        type: String
                    },
                    pincode: {
                        type: String
                    }
                }
            ],
            default: []
        }
    }, {
        timestamps: true
    });


    AccountsSchema.index({ userName: 1 }, { unique: true }); // Creating a unique index on userName
    AccountsSchema.index({ userEmail: 1 }, { unique: true }); // Creating a unique index on userEmail
    AccountsSchema.index({ userReferralCode: 1 }, { unique: true }); // Creating a unique index on userReferralCode
    AccountsSchema.index({ userReferredBy: 1 }); // Creating an index on referredBy
    AccountsSchema.index({ userMobileNumber: 1 }); // Creating an index on userMobileNumber

    return mongoose.models[modelName] || mongoose.model(modelName, AccountsSchema);
};

export default dynamicAccountsModel;