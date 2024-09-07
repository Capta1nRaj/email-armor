// Sign-Up User Imports
import signup from "./src/signup/signup.js";

// Sign-In User Imports
import signin from "./src/signin/signin.js";

// Session Check Imports
import localSessionCheck from "./src/SessionCheck/localSessionCheck.js";
import serverSessionCheck from "./src/SessionCheck/serverSessionCheck.js";

// Only for personal or high-end user (use this if making any admin panel type websites)
import customAddAUser from './src/CustomUserCreation/customAddAUser.js'
import customDeleteAUser from './src/CustomUserCreation/customDeleteAUser.js'

// Logout
import logoutOnce from "./src/LogoutSessions/logoutOnce.js";
import logoutAll from "./src/LogoutSessions/logoutAll.js";

// Basic Features
import resendOTP from "./src/others/resendOTP.js";
import forgotPassword from "./src/PasswordMangment/forgotPassword.js";
import changePassword from "./src/PasswordMangment/changePassword.js"

// Profile Pic Features
import addUserProfilePic from './src/UserDataUpdate/ProfilePicUpdate/addUserProfilePic.js'
import removeProfilePic from './src/UserDataUpdate/ProfilePicUpdate/removeProfilePic.js'

// Username change
import checkUniqueUsername from './src/UserDataUpdate/UsernameChange/checkUniqueUsername.js'
import changeUsername from './src/UserDataUpdate/UsernameChange/changeUsername.js'

// Useremail Change
import checkUniqueEmail from './src/UserDataUpdate/UserEmailChange/checkUniqueEmail.js'
import changeUserEmail from './src/UserDataUpdate/UserEmailChange/changeUserEmail.js'

export {
    signin,
    signup,
    localSessionCheck,
    serverSessionCheck,
    resendOTP,
    forgotPassword,
    customAddAUser,
    customDeleteAUser,
    logoutOnce,
    logoutAll,
    changePassword,
    addUserProfilePic,
    removeProfilePic,
    checkUniqueUsername,
    changeUsername,
    checkUniqueEmail,
    changeUserEmail
};
