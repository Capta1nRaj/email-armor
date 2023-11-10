declare function logoutOnce(username: string, token: string, id: string): Promise<{
    status: number;
    message: string;
}>;
export default logoutOnce;
