#!/usr/bin/env node

import { connect2MongoDB } from 'connect2mongodb';
import settingsModel from '../models/settingsModel.mjs'
import fs from 'fs';

//! Importing The HTML File
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const currentModuleFile = fileURLToPath(import.meta.url);
const emailTemplatePath = path.join(dirname(currentModuleFile), '../src/utils/email-template.html');
const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');

async function generateConfigFile() {

    // Defining The ContentS Of The Configuration File
    const jsonTemplate = {
        "SENDGRID_SIGN_UP_MAIL_TITLE": "Custom-Signup-Title",
        "SENDGRID_SIGN_IN_MAIL_TITLE": "Custom-Signin-Title",
        "SENDGRID_FORGOT_PASSWORD_MAIL_TITLE": "Custom-Forgot-Password-Title",
        "SENDGRID_ADD_A_USER_MAIL_TITLE": "Custom-Add-A-User-Title",
        "REFERRED_POINTS": 100,
        "REFERRED_PERSON_POINTS": 50,
        "OTP_LIMITS": 3,
    }

    //! Generating Email Armor JSON File
    // Checking If File Don't Exist, Generate A File Else Don't
    const checkIfFileExistOrNot = fs.existsSync('email-armour.json');

    // If File Don't Exist, Then, Generate The File
    // If Exist, Then, Skip
    if (checkIfFileExistOrNot === false) {
        // Write the configuration to a file
        fs.writeFileSync('email-armour.json', JSON.stringify(jsonTemplate, null, 2));
        console.log('Configuration File Generated Successfully.');
    } else {
        console.log('Configuration File Successfully Updated.');
    }

    // Defining A Dynamic Email Template
    const htmlTemplate = `${emailTemplate}`;

    //! Generating Email Template HTML File
    // Checking If File Don't Exist, Generate A File Else Don't
    const checkEmailTemplateFile = fs.existsSync('email-template.html');
    // If File Don't Exist, Then, Generate The File
    // If Exist, Then, Skip
    if (checkEmailTemplateFile === false) {
        // Write the configuration to a file
        fs.writeFileSync('email-template.html', htmlTemplate);
        console.log('Email Template HTML File Generated Successfully.');
    }
}

// Updating The Points In The DB
async function generateOrUpdatePoints() {

    // Finding The File In The Dir
    let userConfiJSONData = fs.readFileSync('email-armour.json');
    let userConfig = JSON.parse(userConfiJSONData);

    await connect2MongoDB()

    // Checking If Points Already Exist In DB Or Not
    const checkingIfDataAlreadyGeneratedOrNot = await settingsModel.findOne({})

    //! Updating The User Email Template To MongoDB
    const userRmailTemplate = fs.readFileSync('email-template.html', 'utf8');

    // Defining A Dynamic Email Template
    const htmlTemplate = `${userRmailTemplate}`;

    // If No Document Exists In DB, Create A New One.
    if (!checkingIfDataAlreadyGeneratedOrNot) {

        await new settingsModel({
            referred_points: userConfig.REFERRED_POINTS,
            referred_person_points: userConfig.REFERRED_PERSON_POINTS,
            otp_limits: userConfig.OTP_LIMITS,
            signup_mail_title: userConfig.SENDGRID_SIGN_UP_MAIL_TITLE,
            signin_mail_title: userConfig.SENDGRID_SIGN_IN_MAIL_TITLE,
            forgot_password_mail_title: userConfig.SENDGRID_FORGOT_PASSWORD_MAIL_TITLE,
            add_a_user_mail_title: userConfig.SENDGRID_ADD_A_USER_MAIL_TITLE,
            email_template: htmlTemplate
        }).save();

        // If Document Exists In DB, We Update It.
    } else {

        // Updating The Existing Points In Document With The User New Values/Points.
        await settingsModel.updateOne({}, {
            $set: {
                referred_points: userConfig.REFERRED_POINTS,
                referred_person_points: userConfig.REFERRED_PERSON_POINTS,
                otp_limits: userConfig.OTP_LIMITS,
                signup_mail_title: userConfig.SENDGRID_SIGN_UP_MAIL_TITLE,
                signin_mail_title: userConfig.SENDGRID_SIGN_IN_MAIL_TITLE,
                forgot_password_mail_title: userConfig.SENDGRID_FORGOT_PASSWORD_MAIL_TITLE,
                add_a_user_mail_title: userConfig.SENDGRID_ADD_A_USER_MAIL_TITLE,
                email_template: htmlTemplate
            },
        });

    }
}

//! Running Functions Step By Step
async function runStepByStep() {
    await generateConfigFile()
    await generateOrUpdatePoints()
    process.exit()
}

//! Function Is Called Here
runStepByStep()