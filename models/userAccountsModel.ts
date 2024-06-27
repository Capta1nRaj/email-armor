import mongoose from "mongoose";

const UserAccountsSchema = new mongoose.Schema({
    userFullName: {
        type: String,
        required: true
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
    userProfilePic: {
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
    userBanned: {
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

UserAccountsSchema.index({ userName: 1 }, { unique: true }); // Creating a unique index on userName
UserAccountsSchema.index({ userEmail: 1 }, { unique: true }); // Creating a unique index on userEmail
UserAccountsSchema.index({ userReferralCode: 1 }, { unique: true }); // Creating a unique index on userReferralCode
UserAccountsSchema.index({ userReferredBy: 1 }); // Creating an index on referredBy

export default mongoose.models.userAccounts || mongoose.model("userAccounts", UserAccountsSchema);
