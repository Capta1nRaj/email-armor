declare function sessionCheck(username: string, token: string, id: string): Promise<{
    status: number;
    message: string;
    userName?: undefined;
} | {
    status: number;
    message: string;
    userName: string;
}>;
export default sessionCheck;
