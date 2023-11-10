import { Document, Model } from "mongoose";
interface SettingsModel extends Document {
    referred_points: number;
    referred_person_points: number;
    otp_limits: number;
    signup_mail_title: string;
    signin_mail_title: string;
    forgot_password_mail_title: string;
    email_template: string;
}
declare const SettingsModel: Model<SettingsModel>;
export default SettingsModel;
