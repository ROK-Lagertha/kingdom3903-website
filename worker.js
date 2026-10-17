// The Citadel / Royal Herald — Cloudflare Worker OAuth2
// Requires env.ASSETS and three Cloudflare secrets. Never commit credentials.
const GUILD='1462581217722368074';
const ADMIN='1462585046329200700';
const CLIENT='1557797621832360027';
const SESS='__Host-herald_session',STATE='__Host-herald_state';
const enc=new TextEncoder(),dec=new TextDecoder();
const headers={'cache-control':'no-store','content-type':'application/json; charset=utf-8'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
const redirect=(to,status=302,extra={})=>new Response(null,{status,headers:{location:to,'cache-control':'no-store',...extra}});
const cookie=(name,value,age)=>`${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;
const getCookie=(req,name)=>{const s=req.headers.get('cookie')||'';return s.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||''};
const b64=b=>btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
const rand=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
async function key(env){if(!env.HERALD_SESSION_SECRET||env.HERALD_SESSION_SECRET.length<32)throw Error('Missing session secret');const digest=await crypto.subtle.digest('SHA-256',enc.encode(env.HERALD_SESSION_SECRET));return crypto.subtle.importKey('raw',digest,'AES-GCM',false,['encrypt','decrypt'])}
async function seal(env,value){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(env),enc.encode(JSON.stringify(value)));return b64(iv)+'.'+b64(new Uint8Array(cipher))}
async function open(env,value){try{const [iv,c]=value.split('.');return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(iv)},await key(env),un64(c))))}catch{return null}}
async function discord(path,token){try{const r=await fetch('https://discord.com/api/v10'+path,{headers:{authorization:'Bearer '+token,accept:'application/json'}});return r.ok?await r.json():null}catch{return null}}
async function check(token){const user=await discord('/users/@me',token);if(!user?.id)return null;const member=await discord('/users/@me/guilds/'+GUILD+'/member',token);return {user,admin:Array.isArray(member?.roles)&&member.roles.includes(ADMIN)}}
function callbackUrl(req,env){return env.HERALD_CALLBACK_URL||new URL('/api/herald/callback',req.url).toString()}
function addCookies(response,values){const h=new Headers(response.headers);for(const c of values)h.append('set-cookie',c);return new Response(response.body,{status:response.status,headers:h})}
const fail=(msg)=>new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Royal Herald Login</title><body style="background:#071322;color:#e8c47b;font:18px Arial;text-align:center;padding:10vh 20px"><h1>Royal Herald</h1><p>${msg}</p><a style="color:#e8c47b" href="/news/">Back to the Herald</a></body></html>`,{status:403,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store',"content-security-policy":"default-src 'none'; style-src 'unsafe-inline'"}})
export default {async fetch(req,env){
 const url=new URL(req.url),p=url.pathname;
 if(p==='/news/admin'||p==='/news/admin/'||p==='/news/admin/index.html'){
  if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Method not allowed'},405);
  if(!env.HERALD_SESSION_SECRET)return redirect('/news/');
  const session=await open(env,getCookie(req,SESS));
  if(!session||session.exp<Date.now())return redirect('/news/');
  const member=await check(session.token);
  if(!member?.admin||member.user.id!==session.id)return redirect('/news/');
  const assetUrl=new URL('/news/admin/index.html',url.origin);
  const asset=await env.ASSETS.fetch(new Request(assetUrl,req));
  const h=new Headers(asset.headers);h.set('cache-control','private, no-store');h.set('x-robots-tag','noindex, nofollow');
  return new Response(asset.body,{status:asset.status,headers:h});
 }
 if(!p.startsWith('/api/herald/'))return env.ASSETS.fetch(req);
 if(!env.DISCORD_CLIENT_SECRET||!env.HERALD_SESSION_SECRET)return json({error:'Authentication is not configured'},503);
 if(p==='/api/herald/login'&&req.method==='GET'){
  const nonce=rand();const state=await seal(env,{nonce,exp:Date.now()+600000});
  const q=new URLSearchParams({client_id:CLIENT,response_type:'code',redirect_uri:callbackUrl(req,env),scope:'identify guilds.members.read',state:nonce});
  return redirect('https://discord.com/oauth2/authorize?'+q,302,{'set-cookie':cookie(STATE,state,600)});
 }
 if(p==='/api/herald/callback'&&req.method==='GET'){
  const state=await open(env,getCookie(req,STATE));
  if(!state||state.exp<Date.now()||state.nonce!==url.searchParams.get('state'))return fail('Login state invalid or expired.');
  const code=url.searchParams.get('code');if(!code)return fail('Discord authorization cancelled.');
  const params=new URLSearchParams({client_id:CLIENT,client_secret:env.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code,redirect_uri:callbackUrl(req,env)});
  const tokenRes=await fetch('https://discord.com/api/v10/oauth2/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:params});
  if(!tokenRes.ok)return fail('Discord token exchange failed.');
  const token=await tokenRes.json();if(!token.access_token)return fail('No access token returned.');
  const member=await check(token.access_token);
  if(!member?.admin)return addCookies(fail('Administrator role is required.'),[cookie(STATE,'',0),cookie(SESS,'',0)]);
  const ttl=Math.max(60,Math.min(3600,(token.expires_in||3600)-60));
  const session=await seal(env,{id:member.user.id,token:token.access_token,exp:Date.now()+ttl*1000});
  return addCookies(redirect('/news/admin/'),[cookie(SESS,session,ttl),cookie(STATE,'',0)]);
 }
 if(p==='/api/herald/logout'&&req.method==='POST'){
  const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Invalid origin'},403);
  return addCookies(json({ok:true}),[cookie(SESS,'',0)]);
 }
 if(p==='/api/herald/me'&&req.method==='GET'){
  const session=await open(env,getCookie(req,SESS));if(!session||session.exp<Date.now())return json({authenticated:false,isAdmin:false},401);
  const member=await check(session.token);
  if(!member?.admin||member.user.id!==session.id)return json({authenticated:false,isAdmin:false},403);
  return json({authenticated:true,isAdmin:true,user:{id:member.user.id,username:member.user.username,global_name:member.user.global_name}});
 }
 if(p==='/api/herald/articles')return json({error:'Publishing not yet enabled. D1 and sanitization required.'},501);
 return json({error:'Not found'},404);
}};
