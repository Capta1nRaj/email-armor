import mongoose from "mongoose";
mongoose.set('autoCreate', false);

const SessionsSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    jwtToken: {
        type: String,
    },
    userAgent: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
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

SessionsSchema.index({ userName: 1 }); // Creating a index on userEmail

export default mongoose.models.sessions || mongoose.model("sessions", SessionsSchema);