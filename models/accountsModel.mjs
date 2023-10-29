import mongoose from "mongoose";
mongoose.set('autoCreate', false);

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

AccountsSchema.index({ userName: 1 }, { unique: true }); // Creating a unique index on userName
AccountsSchema.index({ userEmail: 1 }, { unique: true }); // Creating a unique index on userEmail
AccountsSchema.index({ userReferralCode: 1 }, { unique: true }); // Creating a unique index on userReferralCode
AccountsSchema.index({ userReferredBy: 1 }); // Creating an index on referredBy
AccountsSchema.index({ userMobileNumber: 1 }); // Creating an index on userMobileNumber

export default mongoose.models.accounts || mongoose.model("accounts", AccountsSchema);