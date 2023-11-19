// Import necessary modules and set up environment variables
import { config } from 'dotenv';
config();

import sgMail from '@sendgrid/mail';
import settingsModel from '../../models/settingsModel.js';
import { connect2MongoDB } from 'connect2mongodb';

// Check if SENDGRID_API_KEY is defined
if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_EMAIL_ID) {
  throw new Error("SENDGRID_API_KEY or SENDGRID_EMAIL_ID is not defined in your environment variables.");
}

// Define type for email titles
type EmailTitles = {
  signUp: string;
  signIn: string;
  forgotPassword: string;
  addAUser: string;
};

async function sendOTPToUser(username: string, userEmail: string, OTPOrPassword: any, functionPerformed: keyof EmailTitles, userIP: any, userAgent: string) {

  //! Checking if user is trying to hit the API with a software like Postman
  if (!userAgent) {
    return {
      status: 401,
      message: "Your device is unauthorized."
    };
  }

  // Connection to MongoDB
  await connect2MongoDB();

  // Fetch Settings, Get Email Titles & Template From The DB
  const fetchSettings = await settingsModel.findOne({});

  // Determine the email titles based on the action performed
  const emailTitles: EmailTitles = {
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
    .replaceAll('{{userIP}}', userIP)
    .replaceAll('{{userAgent}}', userAgent)

  // Generate and send mail via SendGrid
  const msg = {
    to: userEmail,
    from: process.env.SENDGRID_EMAIL_ID as string,
    subject: emailTitle,
    html: replacedHtml
  };

  await sgMail.send(msg);
}

export default sendOTPToUser;
