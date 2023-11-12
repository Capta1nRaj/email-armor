#!/usr/bin/env node

import { connect2MongoDB } from 'connect2mongodb';
import settingsModel from '../models/settingsModel.mjs'
import fs from 'fs';

//! Importing The HTML File
const emailTemplate = fs.readFileSync(new URL('../src/emailTemplates/email-template.html', import.meta.url), 'utf8');
const addAUserEmailTemplate = fs.readFileSync(new URL('../src/emailTemplates/add-a-user-email-template.html', import.meta.url), 'utf8');

import inquirer from 'inquirer';

function promptUser() {
    const message = 'Would you like to incorporate user creation features? For more details, read more: https://www.example.com';
    return inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmation',
            message: message,
            default: false
        }
    ]);
}

//! When initializing the module for the first time, it will ask the user whether to enable experimental features or not.
async function executeOperationsBasedOnConfirmation() {

    // Checking if files don't exist, Generate the file else don't
    const checkIfFileExistOrNot = fs.existsSync('email-armour.json');
    const checkEmailTemplateFile = fs.existsSync('email-template.html');

    // If any of the files don't exist, run inquirer
    if (checkIfFileExistOrNot === false || checkEmailTemplateFile === false) {

        promptUser().then(async answers => {
            if (answers.confirmation) {
                await generatingAddAUserEmailTemplate();
                await runStepByStep();
            } else {
                await runStepByStep();
            }
        });

        // Else update the points
    } else {
        await runStepByStep();
    }
}

//! Generating the config(.json) file 
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
}

//! Generating email-template.html file 
async function generatingEmailTemplate() {
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

//! Generating add-a-user-email-template.html file 
async function generatingAddAUserEmailTemplate() {
    // Defining A Dynamic Email Template
    const htmlTemplate = `${addAUserEmailTemplate}`;

    const checkEmailTemplateFile = fs.existsSync('add-a-user-email-template.html');
    // If File Don't Exist, Then, Generate The File
    // If Exist, Then, Skip
    if (checkEmailTemplateFile === false) {
        // Write the configuration to a file
        fs.writeFileSync('add-a-user-email-template.html', htmlTemplate);
        console.log('Add A User Email Template HTML File Generated Successfully.');
    }
}

//! Updating the ioints in the DB
async function updatePoints() {

    // Finding the file in the dir
    let userConfiJSONData = fs.readFileSync('email-armour.json');
    let userConfig = JSON.parse(userConfiJSONData);

    // Connection To MongoDB
    await connect2MongoDB();

    // Checking If Points Already Exist In DB Or Not
    const checkingIfDataAlreadyGeneratedOrNot = await settingsModel.findOne({})

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
            },
        });

    }
}

//! Updating the email-template,html value in the DB
async function updateEmailTemplate() {

    //! Updating The User Email Template To MongoDB
    const userEmailTemplate = fs.readFileSync('email-template.html', 'utf8');

    // Connection To MongoDB
    await connect2MongoDB();

    // Defining A Dynamic Email Template
    const htmlTemplate = `${userEmailTemplate}`;

    await settingsModel.updateOne({}, {
        $set: {
            email_template: htmlTemplate
        },
    });
}

//! Updating the add-a-user-email-title.html value in the DB 
async function updateAddAUserEmailTemplate() {

    // Checking If File Don't Exist, Generate A File Else Don't
    const checkEmailTemplateFile = fs.existsSync('add-a-user-email-template.html', 'utf8');

    // Connection To MongoDB
    await connect2MongoDB();

    if (checkEmailTemplateFile === true) {

        const userEmailTemplate = fs.readFileSync('add-a-user-email-template.html', 'utf8');

        // Defining A Dynamic Email Template
        const htmlTemplate = `${userEmailTemplate}`;

        await settingsModel.updateOne({}, {
            $set: {
                add_a_user_template: htmlTemplate
            },
        });
    } else {
        await settingsModel.updateOne({}, {
            $set: {
                add_a_user_template: ""
            },
        });
    }
}

//! Running Functions Step By Step
async function runStepByStep() {
    await generateConfigFile();
    await generatingEmailTemplate();
    await updatePoints();
    await updateEmailTemplate();
    await updateAddAUserEmailTemplate();
    process.exit()
}

executeOperationsBasedOnConfirmation();