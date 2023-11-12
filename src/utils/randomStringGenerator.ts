// Generating Random String Using randomString Module

// @ts-ignore
import randomstring from "randomstring";

async function randomStringGenerator(length: number) {
    return randomstring.generate({
        length: length,
        charset: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    });
}

export default randomStringGenerator;