"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const fs_1 = __importDefault(require("fs"));
fs_1.default.readFile("./secret.txt", null, (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    setAPIKey(data.toString());
    //main();
});
const openai = new openai_1.default({
    apiKey: '', // defaults to process.env["OPENAI_API_KEY"]
});
function setAPIKey(key) {
    openai.apiKey = key;
}
function getCombinationResult(things) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Things: ${things}`);
        const systemPrompt = "This is a simple game. User will specify two or more objects or concepts, and you must return the most sensible result of that combination. For example, water + dirt = mud. Only respond with the result.";
        let userPrompt = things.join(" + ") + " = ";
        const response = yield systemUserRequest(systemPrompt, userPrompt);
        console.log(`Response: ${response}`);
        return response !== null && response !== void 0 ? response : "Failure";
    });
}
function getColor(thing) {
    return __awaiter(this, void 0, void 0, function* () {
        const systemPrompt = "Your job is to provide a hex color in the form #RRGGBB for any string the user provides. If the user provides an object, give the color that best describes that object. If the user provides a concept, give some color that can be tied to that concept. Always give a color, regardless of your ability to discern an appropriate color. Only respond with the color. Do not refuse or give up.";
        const response = yield systemUserRequest(systemPrompt, thing, 5, 10);
        return response !== null && response !== void 0 ? response : "#FFFFFF";
    });
}
function systemUserRequest(systemPrompt, userPrompt, retries = 5, maxLength = 45) {
    return __awaiter(this, void 0, void 0, function* () {
        const completion = yield openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'gpt-3.5-turbo',
        });
        const result = completion.choices[0].message.content;
        if (result.length > maxLength && retries > 0)
            return systemUserRequest(systemPrompt, userPrompt, retries - 1, maxLength);
        if (result.length > maxLength)
            return undefined;
        else
            return result;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield getCombinationResult(["fire", "water"]);
        console.log(response);
    });
}
const http_1 = __importDefault(require("http"));
const port = 8000;
const host = '0.0.0.0';
function setMimeType(res, type) {
    if (type.toLowerCase() == 'json')
        res.setHeader("Content-Type", "application/json");
    if (type.toLowerCase() == 'css')
        res.setHeader("Content-Type", "text/css");
    if (type.toLowerCase() == 'html')
        res.setHeader("Content-Type", "text/html");
    if (type.toLowerCase() == 'js')
        res.setHeader("Content-Type", "text/javascript");
    if (type.toLowerCase() == 'txt')
        res.setHeader("Content-Type", "text/plain");
}
function serveFile(res, file, type) {
    fs_1.default.readFile("." + file, null, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("The requested resource could not be found.");
        }
        else {
            serveString(res, data.toString(), type);
        }
    });
}
function serveString(res, data, type) {
    setMimeType(res, type);
    res.writeHead(200);
    res.end(data);
}
const allowedFiles = [
    "/secret.txt",
    "/style.css",
    "/coloris.min.css",
    "/coloris.min.js",
    "/index.html",
    "/script.js",
    "/bits.json"
];
const server = http_1.default.createServer((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`From ${req.headers.from}: ${req.method} ${req.url}`);
    if (req.url && allowedFiles.includes(req.url.toLowerCase())) {
        console.log("Serving file...");
        serveFile(res, req.url, req.url.split(".").at(-1));
    }
    else if (req.url && req.url.split("/")[1] == "gencombo" && req.url.split("/").length >= 4) {
        // /gencombo/thing1/thing2/.../thing_n
        let things = req.url.split("/").filter(bit => bit != "" && bit != "gencombo");
        const result = yield getCombinationResult(things);
        serveString(res, result, "txt");
    }
    else if (req.url && req.url.split("/")[1] == "gencolor" && req.url.split("/").length >= 3) {
        // /gencolor/thing
        let things = req.url.split("/")[2];
        const result = yield getColor(things);
        serveString(res, result, "txt");
    }
    else {
        console.log("403 Forbidden.");
        res.writeHead(403);
        res.end("Access Denied.");
    }
}));
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
