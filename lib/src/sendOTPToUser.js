// Here OTP Will Be Sent To User Registered E-Mail Will Custom Title/Format Depending Upon The Request
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { config } from 'dotenv';
config();
import sgMail from "@sendgrid/mail";
import settingsModel from '../models/settingsModel';
import { connect2MongoDB } from 'connect2mongodb';
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
else {
    console.error('SENDGRID_API_KEY is not defined.');
}
function sendOTPToUser(username, userEmail, otp, functionPerformed) {
    return __awaiter(this, void 0, void 0, function* () {
        // Connection To MongoDB
        yield connect2MongoDB();
        // It Will Fetch Settings, & Get Email Titles & Template From The DB
        const fetchSettings = yield settingsModel.findOne({});
        // Detecting Title Upon The Usage
        let emailTitle = "";
        if (functionPerformed === 'signUp') {
            emailTitle = (fetchSettings === null || fetchSettings === void 0 ? void 0 : fetchSettings.signup_mail_title) || "";
        }
        else if (functionPerformed === 'signIn') {
            emailTitle = (fetchSettings === null || fetchSettings === void 0 ? void 0 : fetchSettings.signin_mail_title) || "";
        }
        else if (functionPerformed === 'forgotPassword') {
            emailTitle = (fetchSettings === null || fetchSettings === void 0 ? void 0 : fetchSettings.forgot_password_mail_title) || "";
        }
        // Updating The Email Template With username & OTP
        const replacedHtml = ((fetchSettings === null || fetchSettings === void 0 ? void 0 : fetchSettings.email_template) || "")
            .replace(/{{username}}/g, username)
            .replace(/{{otp}}/g, otp);
        // Generating Mail Via Sendgrid
        const msg = {
            to: userEmail,
            from: process.env.SENDGRID_EMAIL_ID || "",
            subject: emailTitle,
            html: replacedHtml
        };
        // Sending Mail Via Sendgrid
        sgMail.send(msg);
    });
}
export default sendOTPToUser;
