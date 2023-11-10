declare function signin(username: string, userPassword: string): Promise<{
    status: number;
    message: string;
    userName?: undefined;
    token?: undefined;
    id?: undefined;
} | {
    status: number;
    message: string;
    userName: string;
    token?: undefined;
    id?: undefined;
} | {
    status: number;
    message: string;
    userName: string;
    token: string;
    id: any;
}>;
export default signin;
