declare function resendOTP(username: string, functionPerformed: string, token: string, id: string): Promise<{
    status: number;
    message: string;
} | undefined>;
export default resendOTP;
