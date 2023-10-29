// Here OTP Will Be Sent To User Registered E-Mail Will Custom Title/Format Depending Upon The Request

import { config } from 'dotenv';
config();
import sgMail from "@sendgrid/mail";
import settingsModel from '../models/settingsModel.mjs';
import { connect2MongoDB } from 'connect2mongodb';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOTPToUser(username, userEmail, otp, functionPerformed) {

  // Connection To MongoDB
  await connect2MongoDB();

  // It Will Fetch Settings, & Get Email Titles & Template From The DB
  const fetchSettings = await settingsModel.findOne({})

  // Detecting Title Upon The Usage
  let emailTitle;

  if (functionPerformed === 'signUp') {
    emailTitle = fetchSettings.signup_mail_title;
  } else if (functionPerformed === 'signIn') {
    emailTitle = fetchSettings.signin_mail_title;
  } else if (functionPerformed === 'forgotPassword') {
    emailTitle = fetchSettings.forgot_password_mail_title;
  }

  // Updating The Email Template With username & OTP
  const replacedHtml = fetchSettings.email_template
    .replaceAll('{{username}}', username.toLowerCase())
    .replaceAll('{{otp}}', otp)

  // Generating Mail Via Sendgrid
  const msg = {
    to: userEmail,
    from: process.env.SENDGRID_EMAIL_ID,
    subject: emailTitle,
    html: replacedHtml
  };

  // Sending Mail Via Sendgrid
  sgMail.send(msg);
}

export default sendOTPToUser;