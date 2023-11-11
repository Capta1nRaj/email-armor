// Generating Random String Using randomString Module

import randomstring from "randomstring";

async function randomStringGenerator(length) {
    return randomstring.generate({
        length: length,
        charset: ["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"],
    });
}

export default randomStringGenerator;