// Fetching User IP Using external-ip NPM Module
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import externalIp from "external-ip";
const externalIpInstance = externalIp();
import util from "util";
// Promisify The External IP Function
const getIPAsync = util.promisify(externalIpInstance);
// Fethcing User IP
function fetchExternalIP() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ip = yield getIPAsync();
            return ip;
        }
        catch (err) {
            throw err;
        }
    });
}
function fetchUserIP() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ip = yield fetchExternalIP();
            // Converting The IP To A String
            const ipString = ip.toString();
            // Returning The IP
            return ipString;
        }
        catch (err) {
            console.error("Error While Fetching IP Is:- ", err);
        }
    });
}
export default fetchUserIP;
