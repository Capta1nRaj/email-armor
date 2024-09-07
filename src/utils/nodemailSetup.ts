'use server'

import nodemailer from "nodemailer";

//! Nodemailer auth settings
const auth = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
        user: process.env.NODEMAILER_USERNAME,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});


//! Send email to the user
export default async function nodemailSetup(data: any) {

    //! Sending the mail to the user
    const receiver = {
        from: process.env.NODEMAILER_MAIL_FROM,
        to: data.userEmail,
        subject: data.emailSubject,
        html: data.emailHTMLTemplate,
    };

    try {
        const result = await auth.sendMail(receiver);
        console.info('%c Email sent successfully', 'background: #222; color: #bada55');
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
