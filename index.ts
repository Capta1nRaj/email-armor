// User Management imports
import signUp from "./src/userManagement/signUp.js";
import signIn from "./src/userManagement/signIn.js";

// Session Validation Imports
import localSessionCheck from "./src/sessionManagement/localSessionCheck.js";
import serverSessionCheck from "./src/sessionManagement/serverSessionCheck.js";

// Logout User Imports
import logoutOnce from "./src/logoutUser/logoutOnce.js";
import logoutAll from "./src/logoutUser/logoutAll.js";

// Basic Features
import resendOTP from "./src/others/resendOTP.js";
import forgotPassword from "./src/passwordManagement/forgotPassword.js";
import changePassword from "./src/passwordManagement/changePassword.js"

// Profile Pic Features
import addUserProfilePic from './src/userDataManagement/ProfilePicUpdate/addUserProfilePic.js'
import removeProfilePic from './src/userDataManagement/ProfilePicUpdate/removeProfilePic.js'

// Username change
import checkUniqueUsername from './src/userDataManagement/UsernameChange/checkUniqueUsername.js'
import changeUsername from './src/userDataManagement/UsernameChange/changeUsername.js'

// Useremail Change
import checkUniqueEmail from './src/userDataManagement/UserEmailChange/checkUniqueEmail.js'
import changeUserEmail from './src/userDataManagement/UserEmailChange/changeUserEmail.js'

export {
    signIn,
    signUp,
    localSessionCheck,
    serverSessionCheck,
    resendOTP,
    forgotPassword,
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
