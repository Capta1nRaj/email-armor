// Sign-Up User Imports
import signup from "./src/SignUP/signUp.js";
import signUpVerify from "./src/SignUP/signUpVerify.js";

// Sign-In User Imports
import signIn from "./src/SignIn/signIn.js";
import signInVerify from "./src/SignIn/signInVerify.js";

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
import addUserProfilePic from './src/ProfilePicUpdate/addUserProfilePic.js'
import removeProfilePic from './src/ProfilePicUpdate/removeProfilePic.js'

export {
    signIn,
    signInVerify,
    signup,
    signUpVerify,
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
    removeProfilePic
};
