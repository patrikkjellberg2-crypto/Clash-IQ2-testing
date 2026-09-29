type Bucket = { count:number; inputChars:number; outputChars:number; lastAt:number; };
const clients = new Map<string, Bucket>();
const events: Array<{at:number; client:string; mode:string; model:string; inputChars:number; outputChars:number; ok:boolean}> = [];
let runtimeDailyLimit = Number(process.env.AI_DAILY_LIMIT || 25);
let runtimeHourlyLimit = Number(process.env.AI_HOURLY_LIMIT || 8);
let globalEnabled = true;

function prune(now=Date.now()) {
  const cutoff = now - 7*24*60*60*1000;
  while (events.length && events[0].at < cutoff) events.shift();
}
function clientId(req:any) {
  const supplied=String(req.header?.("x-clashiq-client-id")||"").trim();
  if (supplied) return supplied.slice(0,100);
  return String(req.ip||req.socket?.remoteAddress||"anonymous").slice(0,100);
}
export function checkAiUsage(req:any) {
  prune();
  const id=clientId(req), now=Date.now(), day=now-86400000, hour=now-3600000;
  const recent=events.filter(e=>e.client===id);
  const daily=recent.filter(e=>e.at>=day).length, hourly=recent.filter(e=>e.at>=hour).length;
  if (!globalEnabled) return {allowed:false, reason:"AI usage is temporarily disabled by admin.", client:id, daily, hourly};
  if (runtimeHourlyLimit>0 && hourly>=runtimeHourlyLimit) return {allowed:false, reason:"Hourly AI limit reached. Please try again later.", client:id, daily, hourly};
  if (runtimeDailyLimit>0 && daily>=runtimeDailyLimit) return {allowed:false, reason:"Daily AI limit reached. Please try again tomorrow.", client:id, daily, hourly};
  return {allowed:true, client:id, daily, hourly};
}
export function recordAiUsage(req:any, mode:string, model:string, inputChars:number, outputChars:number, ok:boolean) {
  prune();
  events.push({at:Date.now(), client:clientId(req), mode, model, inputChars, outputChars, ok});
}
export function getAiUsage() {
  prune();
  const now=Date.now(), day=now-86400000, week=now-7*86400000;
  const recent=events.filter(e=>e.at>=week), today=recent.filter(e=>e.at>=day);
  const unique=(xs:any[])=>new Set(xs.map(e=>e.client)).size;
  const sum=(xs:any[],k:"inputChars"|"outputChars")=>xs.reduce((n,e)=>n+e[k],0);
  const byClient=new Map<string,any>();
  for(const e of today){const x=byClient.get(e.client)||{client:e.client,requests:0,inputChars:0,outputChars:0,lastAt:e.at};x.requests++;x.inputChars+=e.inputChars;x.outputChars+=e.outputChars;x.lastAt=Math.max(x.lastAt,e.at);byClient.set(e.client,x);}
  return {limits:{daily:runtimeDailyLimit,hourly:runtimeHourlyLimit,enabled:globalEnabled},today:{requests:today.length,uniqueClients:unique(today),inputChars:sum(today,"inputChars"),outputChars:sum(today,"outputChars")},week:{requests:recent.length,uniqueClients:unique(recent)},byClient:Array.from(byClient.values()).sort((a,b)=>b.requests-a.requests).slice(0,50),recent:events.slice(-50).reverse()};
}
export function setAiUsageControls(p:{daily?:number;hourly?:number;enabled?:boolean}) {
  if (p.daily!==undefined) runtimeDailyLimit=Math.max(0,Math.floor(Number(p.daily)));
  if (p.hourly!==undefined) runtimeHourlyLimit=Math.max(0,Math.floor(Number(p.hourly)));
  if (p.enabled!==undefined) globalEnabled=Boolean(p.enabled);
}
