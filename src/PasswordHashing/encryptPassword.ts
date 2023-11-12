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

var key = crypto.createHash('sha512').update(secret_key as string, 'utf-8').digest('hex').slice(0, 32);
var iv = crypto.createHash('sha512').update(secret_iv as string, 'utf-8').digest('hex').slice(0, 16);

async function encryptPassword(password: string) {
    try {
        const encryptor = crypto.createCipheriv(encryptionMethod, key, iv);
        const aes_encrypted = encryptor.update(password, 'utf-8', 'base64') + encryptor.final('base64');
        return Buffer.from(aes_encrypted).toString('base64');
    } catch (e) {
        console.log("Error In File encryptPassword.js, Please Raise An Issue, Thanks Mate ♥.");
        return false;
    }
}

export default encryptPassword;
