// Import necessary modules and set up environment variables
import nodemailer from 'nodemailer';
import { connect2MongoDB } from 'connect2mongodb';
import settingsModel from '../../models/settingsModel.js';

//! Nodemailer auth settings 
const auth = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.NODEMAILER_USERNAME,
    pass: process.env.NODEMAILER_PASSWORD
  }
});

//! Define type for email titles
type EmailTitles = {
  signUp: string;
  signIn: string;
  forgotPassword: string;
  addAUser: string;
  changePassword: string
};

async function sendOTPToUser(username: string, userEmail: string, OTPOrPassword: any, functionPerformed: keyof EmailTitles, userIP: any, userAgent: string) {

  if (!process.env.NODEMAILER_USERNAME || !process.env.NODEMAILER_PASSWORD || !process.env.NODEMAILER_MAIL_FROM) {
    throw new Error("Missing environment variables: NODEMAILER_USERNAME, NODEMAILER_PASSWORD, NODEMAILER_MAIL_FROM");
  }

  //! Checking if user is trying to hit the API with a software like Postman
  if (!userAgent) { return { status: 401, message: "Your device is unauthorized." }; }

  // Connection to MongoDB
  await connect2MongoDB();

  // Fetch Settings, Get Email Titles & Template From The DB
  const fetchSettings = await settingsModel.findOne({});

  // Determine the email titles based on the action performed
  const emailTitles: EmailTitles = {
    'signUp': fetchSettings.signup_mail_title,
    'signIn': fetchSettings.signin_mail_title,
    'forgotPassword': fetchSettings.forgot_password_mail_title,
    'addAUser': fetchSettings.add_a_user_mail_title,
    'changePassword': fetchSettings.change_password_mail_title
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

  // Generate and send mail via Nodemailer
  const receiver = {
    from: process.env.NODEMAILER_MAIL_FROM + "<" + process.env.NODEMAILER_USERNAME + ">",
    to: userEmail,
    subject: emailTitle,
    html: replacedHtml,
  };

  try {
    await auth.sendMail(receiver);
  } catch (error) {
    console.log(error);
  }
}

export default sendOTPToUser;
