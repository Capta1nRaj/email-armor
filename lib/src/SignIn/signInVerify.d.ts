declare function signInVerify(username: string, otp: string, id: string): Promise<{
    status: number;
    message: string;
}>;
export default signInVerify;
