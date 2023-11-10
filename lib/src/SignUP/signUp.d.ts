declare function signup(userFullName: string, userName: string, userEmail: string, userPassword: string, userReferredBy: string): Promise<{
    status: number;
    message: string;
    userName?: undefined;
} | {
    status: number;
    message: string;
    userName: string;
}>;
export default signup;
