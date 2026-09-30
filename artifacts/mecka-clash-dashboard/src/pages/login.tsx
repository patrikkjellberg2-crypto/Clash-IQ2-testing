import {useEffect,useRef,useState} from "react";
import {useLocation} from "wouter";
import {Capacitor} from "@capacitor/core";
import {SocialLogin} from "@capgo/capacitor-social-login";
import {Crown,ShieldCheck} from "lucide-react";

declare global{interface Window{google?:any}}

export default function Login(){
  const[,nav]=useLocation();
  const ref=useRef<HTMLDivElement>(null);
  const nativeInitialized=useRef(false);
  const[id,setId]=useState("");
  const[error,setError]=useState("");
  const isAndroid=Capacitor.getPlatform()==="android";

  useEffect(()=>{
    fetch("/api/auth/config").then(r=>r.json()).then(x=>setId(x.clientId||""));
  },[]);

  useEffect(()=>{
    if(!id)return;

    if(isAndroid){
      if(nativeInitialized.current)return;
      nativeInitialized.current=true;
      SocialLogin.initialize({
        google:{webClientId:id,mode:"online"},
      }).catch((e:any)=>{
        nativeInitialized.current=false;
        setError(e?.message||"Google login could not be initialized");
      });
      return;
    }

    if(!ref.current)return;
    const render=()=>{
      if(!window.google||!ref.current)return;
      ref.current.innerHTML="";
      window.google.accounts.id.initialize({
        client_id:id,
        callback:async(x:any)=>{
          try{
            const r=await fetch("/api/auth/google",{
              method:"POST",
              headers:{"Content-Type":"application/json"},
              credentials:"include",
              body:JSON.stringify({credential:x.credential}),
            });
            const d=await r.json();
            if(!r.ok)throw Error(d.error);
            nav("/account");
          }catch(e){
            setError(e instanceof Error?e.message:"Google login failed");
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current,{
        theme:"filled_black",size:"large",shape:"pill",text:"signin_with",width:320
      });
    };
    if(window.google)render();
    else{
      const s=document.createElement("script");
      s.src="https://accounts.google.com/gsi/client";
      s.async=true;s.defer=true;s.onload=render;
      document.head.appendChild(s);
      return()=>s.remove();
    }
  },[id,isAndroid,nav]);

  const nativeGoogleLogin=async()=>{
    setError("");
    try{
      const result=await SocialLogin.login({
        provider:"google",
        options:{
          scopes:["email","profile"],
          filterByAuthorizedAccounts:false,
          autoSelectEnabled:false,
        },
      });
      const credential=result.result?.idToken;
      if(!credential)throw new Error("Google returned no ID token");
      const r=await fetch("/api/auth/google",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        credentials:"include",
        body:JSON.stringify({credential}),
      });
      const d=await r.json();
      if(!r.ok)throw Error(d.error);
      nav("/account");
    }catch(e){
      setError(e instanceof Error?e.message:"Google login failed");
    }
  };

  return <div className="min-h-screen bg-[#07090d] text-white flex items-center justify-center p-5">
    <div className="w-full max-w-md">
      <div className="text-center mb-7">
        <img src="/clash-iq-logo.webp" className="mx-auto h-24 w-24 rounded-3xl"/>
        <h1 className="text-4xl font-black mt-4">Clash IQ</h1>
        <p className="text-white/50 mt-2">War intelligence. Built for your clan.</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[.045] p-7">
        <div className="flex items-center gap-3 mb-6"><Crown className="text-yellow-300"/><b>Sign in to Clash IQ</b></div>
        {isAndroid ? (
          <button type="button" onClick={nativeGoogleLogin} disabled={!id}
            className="w-full h-11 rounded-full bg-white text-black font-semibold disabled:opacity-50">
            {id?"Sign in with Google":"Google login is being configured…"}
          </button>
        ) : <div ref={ref} className="flex justify-center min-h-11"/>}
        {error&&<p className="mt-4 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex items-center gap-2 text-xs text-white/35"><ShieldCheck className="h-4 w-4"/>Secure Google account session</div>
      </div>
    </div>
  </div>
}