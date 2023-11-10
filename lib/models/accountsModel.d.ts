import mongoose from "mongoose";
declare const dynamicAccountsModel: (modelName?: string) => mongoose.Model<any, {}, {}, {}, any, any>;
export default dynamicAccountsModel;
