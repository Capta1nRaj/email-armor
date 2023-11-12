#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
// @ts-ignore
import inquirer from 'inquirer';
// @ts-ignore
import { connect2MongoDB } from 'connect2mongodb';
import settingsModel from '../models/settingsModel.js';
import { URL } from 'url';
//! Importing the HTML files
const emailTemplate = fs.readFileSync(new URL('../src/emailTemplates/email-template.html', import.meta.url), 'utf8');
const addAUserEmailTemplate = fs.readFileSync(new URL('../src/emailTemplates/add-a-user-email-template.html', import.meta.url), 'utf8');
//* Running a prompt that whether the user wants to add user creation feature or not
function promptUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const message = 'Would you like to add user creation features? For more details, read more: https://www.example.com';
        return inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: message,
                default: false
            }
        ]);
    });
}
//* Will execute the functions as per user prompt
function executeOperationsBasedOnConfirmation() {
    return __awaiter(this, void 0, void 0, function* () {
        const checkIfFileExistOrNot = fs.existsSync('email-armour.json');
        const checkEmailTemplateFile = fs.existsSync('email-template.html');
        //*  If any the the above files not exist, will run the prompt & ask user to add user creation feature or not
        if (!checkIfFileExistOrNot || !checkEmailTemplateFile) {
            const answers = yield promptUser();
            //* If user says yes, it will generate a add-a-user-email-template.html
            //* Else if will execute the common functions 
            if (answers.confirmation) {
                yield generatingAddAUserEmailTemplate();
            }
        }
        console.log("Configuration file successfully updated.");
        yield runStepByStep();
    });
}
function generateFileIfNotExists(filename, content) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, content);
            console.log(`${filename} generated successfully.`);
        }
    });
}
//! Generating .json file 
function generateConfigFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const jsonTemplate = {
            "SENDGRID_SIGN_UP_MAIL_TITLE": "Custom-Signup-Title",
            "SENDGRID_SIGN_IN_MAIL_TITLE": "Custom-Signin-Title",
            "SENDGRID_FORGOT_PASSWORD_MAIL_TITLE": "Custom-Forgot-Password-Title",
            "SENDGRID_ADD_A_USER_MAIL_TITLE": "Custom-Add-A-User-Title",
            "REFERRED_POINTS": 100,
            "REFERRED_PERSON_POINTS": 25,
            "OTP_LIMITS": 3,
        };
        generateFileIfNotExists('email-armour.json', JSON.stringify(jsonTemplate, null, 2));
    });
}
//! Generating email-template.html 
function generatingEmailTemplate() {
    return __awaiter(this, void 0, void 0, function* () {
        generateFileIfNotExists('email-template.html', emailTemplate);
    });
}
//! Generating add-a-user-email-template.html
function generatingAddAUserEmailTemplate() {
    return __awaiter(this, void 0, void 0, function* () {
        generateFileIfNotExists('add-a-user-email-template.html', addAUserEmailTemplate);
    });
}
//! Updating the points & values from .json to DB
function updatePoints() {
    return __awaiter(this, void 0, void 0, function* () {
        const userConfiJSONData = fs.readFileSync('email-armour.json', 'utf8');
        const userConfig = JSON.parse(userConfiJSONData);
        //* Checking if document exist or not 
        //* If not, save a new document else update it. 
        const checkingIfDataAlreadyGeneratedOrNot = yield settingsModel.findOne({});
        if (!checkingIfDataAlreadyGeneratedOrNot) {
            yield new settingsModel({
                referred_points: userConfig.REFERRED_POINTS,
                referred_person_points: userConfig.REFERRED_PERSON_POINTS,
                otp_limits: userConfig.OTP_LIMITS,
                signup_mail_title: userConfig.SENDGRID_SIGN_UP_MAIL_TITLE,
                signin_mail_title: userConfig.SENDGRID_SIGN_IN_MAIL_TITLE,
                forgot_password_mail_title: userConfig.SENDGRID_FORGOT_PASSWORD_MAIL_TITLE,
                add_a_user_mail_title: userConfig.SENDGRID_ADD_A_USER_MAIL_TITLE,
            }).save();
        }
        else {
            yield settingsModel.updateOne({}, {
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
    });
}
//! Updating the email-template.html in DB 
function updateEmailTemplate() {
    return __awaiter(this, void 0, void 0, function* () {
        //* Checking if file exist or not, if not create a new one, & save to DB or update the DB with the value in it
        const userEmailTemplate = fs.readFileSync('email-template.html', 'utf8');
        yield settingsModel.updateOne({}, {
            $set: {
                email_template: userEmailTemplate
            },
        });
    });
}
//! Updating the add-a-user-email-template.html in DB
function updateAddAUserEmailTemplate() {
    return __awaiter(this, void 0, void 0, function* () {
        //* Checking if file exist or not, if not create a new one, & save to DB or update the DB with the value in it 
        const checkEmailTemplateFile = fs.existsSync('add-a-user-email-template.html');
        if (checkEmailTemplateFile === true) {
            const userEmailTemplate = fs.readFileSync('add-a-user-email-template.html', 'utf8');
            yield settingsModel.updateOne({}, {
                $set: {
                    add_a_user_template: userEmailTemplate
                },
            });
        }
        else {
            yield settingsModel.updateOne({}, {
                $set: {
                    add_a_user_template: ""
                },
            });
        }
    });
}
//! Running all the functions step by step 
function runStepByStep() {
    return __awaiter(this, void 0, void 0, function* () {
        // Connection to MongoDB
        yield connect2MongoDB();
        // Running the functions
        yield generateConfigFile();
        yield generatingEmailTemplate();
        yield updatePoints();
        yield updateEmailTemplate();
        yield updateAddAUserEmailTemplate();
        // Exiting the process
        process.exit();
    });
}
executeOperationsBasedOnConfirmation();
