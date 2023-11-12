import mongoose from "mongoose";
mongoose.set('autoCreate', false);
const SettingsSchema = new mongoose.Schema({
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
    signup_mail_title: {
        type: String,
        default: "Custom-Signup-Title"
    },
    signin_mail_title: {
        type: String,
        default: "Custom-Signin-Title"
    },
    forgot_password_mail_title: {
        type: String,
        default: "Custom-Forgot-Password-Title"
    },
    add_a_user_mail_title: {
        type: String,
        default: "Add-A-User-Title"
    },
    email_template: {
        type: String,
        default: ""
    },
    add_a_user_template: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});
export default mongoose.models.settings || mongoose.model("settings", SettingsSchema);
