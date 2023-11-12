var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Import necessary modules and set up environment variables
import { config } from 'dotenv';
config();
import sgMail from '@sendgrid/mail';
import settingsModel from '../../models/settingsModel.js';
// @ts-ignore
import { connect2MongoDB } from 'connect2mongodb';
// Check if SENDGRID_API_KEY is defined
if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_EMAIL_ID) {
    throw new Error("SENDGRID_API_KEY or SENDGRID_EMAIL_ID is not defined in your environment variables.");
}
function sendOTPToUser(username, userEmail, OTPOrPassword, functionPerformed, userIP) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(username, userEmail, OTPOrPassword, functionPerformed);
        // Connection to MongoDB
        yield connect2MongoDB();
        // Fetch Settings, Get Email Titles & Template From The DB
        const fetchSettings = yield settingsModel.findOne({});
        // Determine the email titles based on the action performed
        const emailTitles = {
            'signUp': fetchSettings.signup_mail_title,
            'signIn': fetchSettings.signin_mail_title,
            'forgotPassword': fetchSettings.forgot_password_mail_title,
            'addAUser': fetchSettings.add_a_user_mail_title
        };
        const emailTitle = emailTitles[functionPerformed];
        // Determine which email template to use
        const emailTemplate = functionPerformed === 'addAUser' ? fetchSettings.add_a_user_template : fetchSettings.email_template;
        // Update the email template with username and OTPOrPassword
        const replacedHtml = emailTemplate
            .replaceAll('{{username}}', username.toLowerCase())
            .replaceAll('{{OTPOrPassword}}', OTPOrPassword)
            .replaceAll('{{userIP}}', userIP);
        // Generate and send mail via SendGrid
        const msg = {
            to: userEmail,
            from: process.env.SENDGRID_EMAIL_ID,
            subject: emailTitle,
            html: replacedHtml
        };
        yield sgMail.send(msg);
    });
}
export default sendOTPToUser;
