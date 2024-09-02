import mongoose from "mongoose";

const userAccountsSchema = new mongoose.Schema({
    userFullName: { type: String, required: true },
    userName: { type: String, required: true, unique: true, },
    userEmail: { type: String, required: true, unique: true, },
    userPassword: { type: String, required: true, },
    userMobileNumber: { type: String, },
    userProfilePic: { type: String, default: "" },
    userReferralCode: { type: String, required: true, unique: true, },
    userReferrals: { type: [mongoose.Schema.Types.ObjectId], ref: "userAccounts", default: [] },
    userReferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "userAccounts", required: false },
    userVerified: { type: Boolean, default: true },
    userBanned: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    userRole: { type: String },
}, {
    timestamps: true
});

userAccountsSchema.index({ userName: 1 }, { unique: true }); // Creating a unique index on userName
userAccountsSchema.index({ userEmail: 1 }, { unique: true }); // Creating a unique index on userEmail
userAccountsSchema.index({ userReferralCode: 1 }, { unique: true }); // Creating a unique index on userReferralCode
userAccountsSchema.index({ userReferredBy: 1 }); // Creating an index on referredBy

export default mongoose.models.userAccounts || mongoose.model('userAccounts', userAccountsSchema);