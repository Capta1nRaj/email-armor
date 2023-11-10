import { Document, Model } from "mongoose";
interface OTPModel extends Document {
    userName: string;
    OTP: string;
    OTPCount: number;
    expireAt: Date;
}
declare const OTPModel: Model<OTPModel>;
export default OTPModel;
