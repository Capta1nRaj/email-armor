import mongoose from "mongoose";
mongoose.set('autoCreate', false);

const SettingsSchema = new mongoose.Schema({
    sign_in_mail_title: {
        type: String,
        default: "Custom-Sign-In-Title"
    },
    forgot_password_mail_title: {
        type: String,
        default: "Custom-Forgot-Password-Title"
    },
    referred_points: {
        type: Number,
        default: 0,
    },
    referred_person_points: {
        type: Number,
        default: 0,
    },
    otp_limits: {
        type: Number,
        default: 0,
    },
    email_template: {
        type: String,
        default: ""
    },
}, {
    timestamps: true
});

export default mongoose.models.settings || mongoose.model("settings", SettingsSchema);