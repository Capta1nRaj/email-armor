import mongoose from "mongoose";
mongoose.set('autoCreate', false);

const OTPSchema = new mongoose.Schema({
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

OTPSchema.index({ userName: 1 }); // Creating an index on userName

export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);