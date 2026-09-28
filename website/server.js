import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir=path.dirname(fileURLToPath(import.meta.url));
const html=fs.readFileSync(path.join(dir,"index.html"));
const server=http.createServer((req,res)=>{if(req.method!=="GET"){res.writeHead(405);res.end("Method Not Allowed");return;}res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"});res.end(html);});
const port=Number(process.env.PORT||10000);server.listen(port,"0.0.0.0");
