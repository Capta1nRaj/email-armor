declare function logoutAll(username: string, token: string, id: string): Promise<{
    status: number;
    message: string;
}>;
export default logoutAll;
