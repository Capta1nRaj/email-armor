import mongoose from "mongoose";
mongoose.set('autoCreate', false);
const otpSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    OTP: {
        type: String,
        required: true
    },
    OTPCount: {
        type: Number,
        default: 0,
    },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 300
    },
}, {
    timestamps: true
});
otpSchema.index({ userName: 1 });
const OTPModel = mongoose.models.OTP || mongoose.model("OTP", otpSchema);
export default OTPModel;
