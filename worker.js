// The Citadel / Royal Herald — Cloudflare Worker OAuth2
// Requires env.ASSETS and three Cloudflare secrets. Never commit credentials.
const GUILD='1462581217722368074';
const ADMIN='1561084418246844477';
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
// A Discord 429 is a temporary API limitation, not evidence of a missing role.
// At login only: wait briefly and retry once, respecting Retry-After (max 3 seconds).
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function discord(path,token){
 for(let attempt=0;attempt<2;attempt++){
  try{
   const r=await fetch('https://discord.com/api/v10'+path,{headers:{authorization:'Bearer '+token,accept:'application/json'}});
   if(r.status===429){
    let retry=0;
    try{const data=await r.json();retry=Number(data.retry_after)||0}catch{}
    const h=Number(r.headers.get('retry-after'));if(Number.isFinite(h)&&h>0)retry=h;
    if(attempt===0&&retry>0&&retry<=3){await wait(retry*1000+100);continue}
    return {ok:false,status:429,retryAfter:retry};
   }
   if(!r.ok)return {ok:false,status:r.status};
   return {ok:true,data:await r.json()};
  }catch{return {ok:false,status:0}}
 }
 return {ok:false,status:429};
}
async function check(token){
 // One membership call: the guild member response includes user.id and roles.
 const member=await discord('/users/@me/guilds/'+GUILD+'/member',token);
 if(!member.ok)return {admin:false,reason:'discord_membership_unavailable',discordStatus:member.status,retryAfter:member.retryAfter};
 const user=member.data?.user;
 if(!user?.id)return {admin:false,reason:'discord_identity_unavailable'};
 if(!Array.isArray(member.data?.roles))return {user,admin:false,reason:'discord_roles_missing'};
 return {user,admin:member.data.roles.includes(ADMIN),reason:member.data.roles.includes(ADMIN)?'ok':'reporter_role_not_present'};
}
// A short-lived encrypted authorization snapshot avoids Discord calls on every
// page load. Access automatically expires and must then be re-authorized.
function validSession(session){return !!(session&&session.exp>Date.now()&&session.verifiedUntil>Date.now()&&session.role===ADMIN&&session.id)}
function callbackUrl(req,env){return env.HERALD_CALLBACK_URL||new URL('/api/herald/callback',req.url).toString()}
function addCookies(response,values){const h=new Headers(response.headers);for(const c of values)h.append('set-cookie',c);return new Response(response.body,{status:response.status,headers:h})}
const fail=(msg)=>new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Royal Herald Login</title><body style="background:#071322;color:#e8c47b;font:18px Arial;text-align:center;padding:10vh 20px"><h1>Royal Herald</h1><p>${msg}</p><a style="color:#e8c47b" href="/news/">Back to the Herald</a></body></html>`,{status:403,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store',"content-security-policy":"default-src 'none'; style-src 'unsafe-inline'"}})
export default {async fetch(req,env){
 const url=new URL(req.url),p=url.pathname;
 if(p==='/news/admin'||p==='/news/admin/'||p==='/news/admin/index.html'){
  if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Method not allowed'},405);
  if(!env.HERALD_SESSION_SECRET)return redirect('/news/');
  const session=await open(env,getCookie(req,SESS));
  if(!validSession(session))return redirect('/news/');
  const assetUrl=new URL('/news/admin/dashboard.html',url.origin);
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
  if(!member?.admin){console.warn('Herald OAuth authorization rejected',member?.reason||'unknown',member?.discordStatus||'');return addCookies(fail(member?.reason==='discord_membership_unavailable'?'Discord membership check temporarily unavailable (HTTP '+member.discordStatus+'). Please wait and try again.':member?.reason==='reporter_role_not_present'?'Reporter role is not present in the Discord membership response.':'Discord identity could not be verified.'),[cookie(STATE,'',0),cookie(SESS,'',0)]);}
  const ttl=Math.max(60,Math.min(900,(token.expires_in||3600)-60));
  const expires=Date.now()+ttl*1000;
  const session=await seal(env,{id:member.user.id,username:member.user.username,global_name:member.user.global_name,role:ADMIN,exp:expires,verifiedUntil:expires});
  return addCookies(redirect('/news/admin/'),[cookie(SESS,session,ttl),cookie(STATE,'',0)]);
 }
 if(p==='/api/herald/logout'&&req.method==='POST'){
  const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Invalid origin'},403);
  return addCookies(json({ok:true}),[cookie(SESS,'',0)]);
 }
 if(p==='/api/herald/me'&&req.method==='GET'){
  const session=await open(env,getCookie(req,SESS));if(!validSession(session))return json({authenticated:false,isAdmin:false},401);
  return json({authenticated:true,isAdmin:true,user:{id:session.id,username:session.username,global_name:session.global_name}});
 }
 if(p==='/api/herald/articles')return json({error:'Publishing not yet enabled. D1 and sanitization required.'},501);
 return json({error:'Not found'},404);
}};
