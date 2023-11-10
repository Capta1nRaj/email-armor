import mongoose from "mongoose";
mongoose.set('autoCreate', false);
const SessionsSchema = new mongoose.Schema({
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
const SessionsModel = mongoose.models.sessions || mongoose.model("sessions", SessionsSchema);
export default SessionsModel;
