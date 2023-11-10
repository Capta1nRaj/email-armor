import { Document, Model } from "mongoose";
interface SessionsModel extends Document {
    userName: string;
    token: string;
    userIP: string;
    userVerified: boolean;
    OTP: string;
    OTPCount: number;
    expireAt: Date;
}
declare const SessionsModel: Model<SessionsModel>;
export default SessionsModel;
