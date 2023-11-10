declare function forgotPassword(username: string, OTP: string, newPassword: string): Promise<{
    status: number;
    message: string;
    userName?: undefined;
} | {
    status: number;
    message: string;
    userName: string;
} | undefined>;
export default forgotPassword;
