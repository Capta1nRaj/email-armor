import mongoose, { Document, Model } from "mongoose";

mongoose.set('autoCreate', false);

interface OTPModel extends Document {
    userName: string;
    OTP: string;
    OTPCount: number;
    expireAt: Date;
}

const otpSchema = new mongoose.Schema<OTPModel>({
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

const OTPModel: Model<OTPModel> = mongoose.models.OTP || mongoose.model<OTPModel>("OTP", otpSchema);

export default OTPModel;