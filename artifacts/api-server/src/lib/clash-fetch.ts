import type { ClashRecord, FetchResult } from "./clash-types";
export const CLASH_API_BASE_URL = process.env.CLASH_API_BASE_URL ?? "https://cocproxy.royaleapi.dev/v1";
export const CLASHKING_API_BASE_URL = process.env.CLASHKING_API_BASE_URL ?? "https://api.clashk.ing";
export async function fetchClashResource(path:string,signal:AbortSignal):Promise<ClashRecord|ClashRecord[]|null>{
 const token=process.env.CLASH_API_TOKEN; if(!token)return null;
 const response=await fetch(`${CLASH_API_BASE_URL}${path}`,{headers:{Accept:"application/json",Authorization:`Bearer ${token}`},signal});
 if(!response.ok){const error=new Error(`Clash API returned ${response.status}`);Object.assign(error,{status:response.status,path});throw error;}
 return await response.json() as ClashRecord|ClashRecord[];
}
export async function fetchClashKingResource(path:string,signal:AbortSignal):Promise<ClashRecord|ClashRecord[]|null>{
 const response=await fetch(`${CLASHKING_API_BASE_URL}${path}`,{headers:{Accept:"application/json"},signal});
 if(!response.ok){const error=new Error(`ClashKing API returned ${response.status}`);Object.assign(error,{status:response.status,path});throw error;}
 return await response.json() as ClashRecord|ClashRecord[];
}
export async function fetchOptionalClashKingResource(path:string,fallback:ClashRecord|ClashRecord[]|null,log:{warn:(obj:object,message:string)=>void}):Promise<FetchResult>{
 const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),10000);
 try{return {data:await fetchClashKingResource(path,controller.signal),failed:false};}
 catch(error){log.warn({path,status:typeof error==="object"&&error!==null&&"status"in error?error.status:undefined},"ClashKing API resource unavailable");return {data:fallback,failed:true};}
 finally{clearTimeout(timeout);}
}
export async function fetchOptionalResource(path:string,fallback:ClashRecord|ClashRecord[]|null,log:{warn:(obj:object,message:string)=>void}):Promise<FetchResult>{
 const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),10000);
 try{return {data:await fetchClashResource(path,controller.signal),failed:false};}
 catch(error){log.warn({path,status:typeof error==="object"&&error!==null&&"status"in error?error.status:undefined},"Clash API resource unavailable");return {data:fallback,failed:true};}
 finally{clearTimeout(timeout);}
}