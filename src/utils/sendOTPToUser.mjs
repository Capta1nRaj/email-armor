// Here OTPOrPassword Will Be Sent To User Registered E-Mail Will Custom Title/Format Depending Upon The Request

import { config } from 'dotenv';
config();

import sgMail from '@sendgrid/mail';
import settingsModel from '../../models/settingsModel.mjs';
import { connect2MongoDB } from 'connect2mongodb';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOTPToUser(username, userEmail, OTPOrPassword, functionPerformed, userIP) {
  console.log(username, userEmail, OTPOrPassword, functionPerformed)
  // Connection To MongoDB
  await connect2MongoDB();

  // Fetch Settings, Get Email Titles & Template From The DB
  const fetchSettings = await settingsModel.findOne({});

  // Determine the email title based on the action performed
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

  sgMail.send(msg);
}

export default sendOTPToUser;