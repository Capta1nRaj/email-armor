declare function sendOTPToUser(username: string, userEmail: string, otp: string, functionPerformed: string): Promise<void>;
export default sendOTPToUser;
