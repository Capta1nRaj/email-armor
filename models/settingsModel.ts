import mongoose, { Document, Model } from "mongoose";

mongoose.set('autoCreate', false);

interface SettingsModel extends Document {
    referred_points: number;
    referred_person_points: number;
    otp_limits: number;
    signup_mail_title: string;
    signin_mail_title: string;
    forgot_password_mail_title: string;
    email_template: string;
}

const SettingsSchema = new mongoose.Schema<SettingsModel>({
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
    email_template: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const SettingsModel: Model<SettingsModel> = mongoose.models.settings || mongoose.model<SettingsModel>("settings", SettingsSchema);

export default SettingsModel;