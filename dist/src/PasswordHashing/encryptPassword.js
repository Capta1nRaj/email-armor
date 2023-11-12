var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { config } from 'dotenv';
config();
import crypto from 'crypto';
const secret_key = process.env.SECRET_KEY;
const secret_iv = process.env.SECRET_IV;
const encryptionMethod = 'AES-256-CBC';
// Checing The Lengths Of secret_key and secret_iv
if ((secret_key && secret_key.length < 32) || (secret_iv && secret_iv.length < 32)) {
    console.log("Make Sure Your secret_key & secret_iv Length Must Be 32 Or Greater.");
    // return false;
}
var key = crypto.createHash('sha512').update(secret_key, 'utf-8').digest('hex').slice(0, 32);
var iv = crypto.createHash('sha512').update(secret_iv, 'utf-8').digest('hex').slice(0, 16);
function encryptPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const encryptor = crypto.createCipheriv(encryptionMethod, key, iv);
            const aes_encrypted = encryptor.update(password, 'utf-8', 'base64') + encryptor.final('base64');
            return Buffer.from(aes_encrypted).toString('base64');
        }
        catch (e) {
            console.log("Error In File encryptPassword.js, Please Raise An Issue, Thanks Mate ♥.");
            return false;
        }
    });
}
export default encryptPassword;
