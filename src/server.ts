import OpenAI from 'openai';
import fs from 'fs';

fs.readFile("./secret.txt", null, (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  setAPIKey(data.toString());
  //main();
})

const openai = new OpenAI({
  apiKey: '', // defaults to process.env["OPENAI_API_KEY"]
});

function setAPIKey(key: string) {
  openai.apiKey = key;
}

async function getCombinationResult(things: string[]): Promise<string> {
  console.log(`Things: ${things}`);
  const systemPrompt = "This is a simple game. User will specify two or more objects or concepts, and you must return the most sensible result of that combination. For example, water + dirt = mud. Only respond with the result.";
  let userPrompt = things.join(" + ") + " = ";
  const response = await systemUserRequest(systemPrompt, userPrompt);
  console.log(`Response: ${response}`);
  return response ?? "Failure";
}

async function getColor(thing: string): Promise<string> {
  const systemPrompt = "Your job is to provide a hex color in the form #RRGGBB for any string the user provides. If the user provides an object, give the color that best describes that object. If the user provides a concept, give some color that can be tied to that concept. Always give a color, regardless of your ability to discern an appropriate color. Only respond with the color. Do not refuse or give up.";
  const response = await systemUserRequest(systemPrompt, thing, 5, 10);
  return response ?? "#FFFFFF";
}

async function systemUserRequest(systemPrompt: string, userPrompt: string, retries: number = 5, maxLength: number = 45): Promise<string | undefined> {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'gpt-3.5-turbo',
  });
  const result = completion.choices[0].message.content as string;
  if (result.length > maxLength && retries > 0) return systemUserRequest(systemPrompt, userPrompt, retries - 1, maxLength);
  if (result.length > maxLength) return undefined;
  else return result;
}

async function main() {
  const response = await getCombinationResult(["fire", "water"]);

  console.log(response);
}

import http from 'http';

const port = 8000;
const host = '0.0.0.0';

function setMimeType(res: http.ServerResponse<http.IncomingMessage>, type: string) {
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

function serveFile(res: http.ServerResponse<http.IncomingMessage>, file: string, type: string) {
  fs.readFile("." + file, null, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("The requested resource could not be found.");
    } else {
      serveString(res, data.toString(), type);
    }
  });
}

function serveString(res: http.ServerResponse<http.IncomingMessage>, data: string, type: string) {
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

const server = http.createServer(async (req, res) => {
  console.log(`From ${req.headers.from}: ${req.method} ${req.url}`);
  if (req.url && allowedFiles.includes(req.url.toLowerCase())) {
    console.log("Serving file...");
    serveFile(res, req.url, req.url.split(".").at(-1) as string);
  } 
  else if (req.url && req.url.split("/")[1] == "gencombo" && req.url.split("/").length >= 4) {
    // /gencombo/thing1/thing2/.../thing_n
    let things = req.url.split("/").filter(bit => bit != "" && bit != "gencombo");
    const result = await getCombinationResult(things);
    serveString(res, result, "txt");
  }
  else if (req.url && req.url.split("/")[1] == "gencolor" && req.url.split("/").length >= 3) {
    // /gencolor/thing
    let things = req.url.split("/")[2];
    const result = await getColor(things);
    serveString(res, result, "txt");
  }
  else {
    console.log("403 Forbidden.");
    res.writeHead(403);
    res.end("Access Denied.");
  }
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
}); 