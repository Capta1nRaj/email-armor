declare function signUpVerify(username: string, otp: string): Promise<{
    status: number;
    message: string;
} | undefined>;
export default signUpVerify;
