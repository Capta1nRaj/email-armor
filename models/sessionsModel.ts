import mongoose, { Document, Model } from "mongoose";

mongoose.set('autoCreate', false);

interface SessionsModel extends Document {
    userName: string;
    token: string;
    userIP: string;
    userVerified: boolean;
    OTP: string;
    OTPCount: number;
    expireAt: Date;
}

const SessionsSchema = new mongoose.Schema<SessionsModel>({
    userName: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    userIP: {
        type: String,
        required: true
    },
    userVerified: {
        type: Boolean,
        default: false,
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

SessionsSchema.index({ userName: 1 });

const SessionsModel: Model<SessionsModel> = mongoose.models.sessions || mongoose.model<SessionsModel>("sessions", SessionsSchema);

export default SessionsModel;