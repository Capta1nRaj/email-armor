#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { connect2MongoDB } from 'connect2mongodb';
import settingsModel from '../models/settingsModel.js';
import { URL } from 'url';
import inquirer from 'inquirer';

// Reading the HTML email template file
const emailTemplate = fs.readFileSync(new URL('../src/EmailTemplates/email-template.html', import.meta.url), 'utf8');

// Function to generate the initial JSON configuration file if it doesn't exist
// Function to generate the initial JSON configuration file if it doesn't exist
async function generateJSONFile() {
    try {
        const emailArmorJSONFileExists = fs.existsSync('email-armor.json');
        if (!emailArmorJSONFileExists) {
            const jsonTemplate = {
                "SIGN_IN_MAIL_TITLE": "Custom-Sign-In-Title",
                "FORGOT_PASSWORD_MAIL_TITLE": "Custom-Forgot-Password-Title",
                "REFERRED_POINTS": 100,
                "REFERRED_PERSON_POINTS": 25,
                "OTP_LIMITS": 3,
                "SETUP_DONE": false
            };

            // Save the initial settings to MongoDB
            await new settingsModel({
                sign_in_mail_title: jsonTemplate.SIGN_IN_MAIL_TITLE,
                forgot_password_mail_title: jsonTemplate.FORGOT_PASSWORD_MAIL_TITLE,
                referred_points: jsonTemplate.REFERRED_POINTS,
                referred_person_points: jsonTemplate.REFERRED_PERSON_POINTS,
                otp_limits: jsonTemplate.OTP_LIMITS,
            }).save();

            // Generate the 'email-armor.json' file
            await generateFileIfNotExists('email-armor.json', JSON.stringify(jsonTemplate, null, 2));
        }
    } catch (error) {
        console.error("Error generating the JSON configuration file:", error);
        process.exit(1);  // Exit if the file operation fails
    }
}

// Function to generate the HTML email template file if it doesn't exist
async function generateHTMLTemplateFile() {
    const emailTemplateFileExists = fs.existsSync('email-template.html');
    if (!emailTemplateFileExists) {
        // Generate the 'email-template.html' file
        await generateFileIfNotExists('email-template.html', emailTemplate);
    } else {
        // Ensure the file is readable
        try {
            const userEmailTemplate = fs.readFileSync('email-template.html', 'utf8');
            return userEmailTemplate;
        } catch (error) {
            console.error('Error reading email template:', error);
            process.exit(1);  // Exit if the file operation fails
        }
    }
}

// Function to generate schema model files based on user confirmation
async function generateSchemaFiles() {
    const userConfig = JSON.parse(fs.readFileSync('email-armor.json', 'utf8'));

    // If schema files haven't been set up yet
    if (!userConfig.SETUP_DONE) {
        const message = 'Would you like to generate all the Schema files? For more details, visit: https://www.example.com';
        const answer = await inquirer.prompt([{ type: 'confirm', name: 'confirmation', message: message, default: false }]);

        if (answer.confirmation) {
            const modelFiles = ['userAccountsModel', 'otpModel', 'referHistoryModel', 'sessionsModel', 'settingsModel'];

            // Loop through each model file and generate the corresponding TypeScript file if not already present
            for (const filename of modelFiles) {
                const filePath = fs.readFileSync(new URL(`../models/${filename}.js`, import.meta.url), 'utf8');
                await generateFileIfNotExists(`${filename}.ts`, filePath, 'email-armor-models');
            }
        }
    }

    // Update the SETUP_DONE flag and save the modified JSON file
    fs.writeFileSync('email-armor.json', JSON.stringify({ ...userConfig, SETUP_DONE: true }, null, 2));
}

// Function to update the database with settings from the JSON file and email template
async function updateData() {
    // Destructure the necessary fields from the JSON file
    const { REFERRED_POINTS, REFERRED_PERSON_POINTS, OTP_LIMITS, FORGOT_PASSWORD_MAIL_TITLE } = JSON.parse(fs.readFileSync('email-armor.json', 'utf8'));

    // Read the HTML email template file from the local file system
    const userEmailTemplate = fs.readFileSync('email-template.html', 'utf8');

    // Upsert: Update the document with new settings, or create a new document if none exists
    await settingsModel.updateOne({},  // Empty filter to target the only document in the collection
        {
            $set: {
                referred_points: REFERRED_POINTS,
                referred_person_points: REFERRED_PERSON_POINTS,
                otp_limits: OTP_LIMITS,
                forgot_password_mail_title: FORGOT_PASSWORD_MAIL_TITLE,
                email_template: userEmailTemplate  // Set the email template content in the document
            }
        },
        { upsert: true }  // Create a new document if it doesn't already exist
    );
}

// Main function to run all steps in sequence
async function runStepByStep() {
    // Connect to MongoDB and run all the setup steps
    await connect2MongoDB();

    // Generate or update the JSON configuration file
    await generateJSONFile();

    // Generate the email template file
    await generateHTMLTemplateFile();

    // Optionally generate schema files
    await generateSchemaFiles();

    // Update the database with the latest settings
    await updateData();

    // Exit the process after completing tasks
    process.exit();
}

// Execute the setup process
runStepByStep();

// Function to generate a file if it doesn't already exist
async function generateFileIfNotExists(filename: string, content: string, folderPath?: string) {
    const filePath = path.resolve(folderPath || "", filename);

    // Ensure the target directory exists, and create it if necessary
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    // Check if the file already exists; if not, generate it
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.info(`\n ${filePath} generated successfully.`);
    }
}