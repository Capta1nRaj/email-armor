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
import customAddAUser from './src/customUserCreation/customAddAUser.js'
import customDeleteAUser from './src/customUserCreation/customDeleteAUser.js'

// Logout
import logoutOnce from "./src/logout/logoutOnce.js";
import logoutAll from "./src/logout/logoutAll.js";

// Basic Features
import resendOTP from "./src/others/resendOTP.js";
import forgotPassword from "./src/others/forgotPassword.js";
import changePassword from "./src/others/changePassword.js"

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
    changePassword
};
