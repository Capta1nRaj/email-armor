import mongoose from "mongoose";
mongoose.set('autoCreate', false);

const ReferHistorySchema = new mongoose.Schema({
    userName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: process.env.ACCOUNTS_MODEL_NAME || "accounts"
    },
    points: {
        type: Number,
    },
    reason: {
        type: String,
    }
}, {
    timestamps: true
});

ReferHistorySchema.index({ userName: 1 }); // Creating an index on userName

export default mongoose.models.referHistory || mongoose.model("referHistory", ReferHistorySchema);