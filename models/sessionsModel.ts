import mongoose from "mongoose";
mongoose.set('autoCreate', false);

const SessionsSchema = new mongoose.Schema({
    userName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userAccounts"
    },
    jwtToken: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        required: true
    },
    userRole: {
        type: String
    },
    OTP: {
        type: String
    },
    OTPCount: {
        type: Number
    },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 600
    },
}, {
    timestamps: true
});

export default mongoose.models.sessions || mongoose.model("sessions", SessionsSchema);