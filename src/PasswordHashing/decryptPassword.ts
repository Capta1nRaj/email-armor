import { config } from 'dotenv';
config();
import crypto from 'crypto';
var secret_key = process.env.SECRET_KEY;
var secret_iv = process.env.SECRET_IV;
var encryptionMethod = 'AES-256-CBC';

// Checing The Lengths Of secret_key and secret_iv
if ((secret_key && secret_key.length < 32) || (secret_iv && secret_iv.length < 32)) {
    console.log("Make Sure Your secret_key & secret_iv Length Must Be 32 Or Greater.");
    // return false;
}

var key = crypto.createHash('sha512').update(secret_key || "", 'utf-8').digest('hex').slice(0, 32);
var iv = crypto.createHash('sha512').update(secret_iv  || "", 'utf-8').digest('hex').slice(0, 16);

async function decryptPassword(password: string) {
    try {

        const buff = Buffer.from(password, 'base64');
        password = buff.toString('utf-8');
        var decryptor = crypto.createDecipheriv(encryptionMethod, key, iv);
        return decryptor.update(password, 'base64', 'utf8') + decryptor.final('utf8');

    } catch (e) {

        console.log("Error In File decryptPassword.js, Please Raise An Issue, Thanks Mate ♥.")
        return false;

    }
}

export default decryptPassword;