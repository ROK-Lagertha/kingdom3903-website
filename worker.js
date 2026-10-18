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

// D1 editorial API. Only a verified Reporter session may read or change drafts.
function sameOrigin(req,url){const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return false;const site=req.headers.get('sec-fetch-site');return !site||site==='same-origin'||site==='none'}
function cleanText(v,max){return typeof v==='string'?v.trim().slice(0,max):''}
function safeBody(v){return typeof v==='string'?v.slice(0,50000):''}
function slugify(v){return v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'dispatch'}
async function audit(db,id,actor,action){await db.prepare('INSERT INTO herald_article_audit(article_id,actor_discord_id,action) VALUES(?,?,?)').bind(id,actor,action).run()}
// Safe formatting-only HTML. Accept common editor attributes but strip them on output.
// Unsupported elements (including script, style, iframe, img and links) are rejected.
function normalizeLegacyRokMarkup(input){
 // Legacy Rise of Kingdoms mail markup is not HTML. Translate only known formatting
 // tokens, keeping the actual HTML sanitizer as the final security boundary.
 let value=String(input||'');
 value=value.replace(/(?:<|&lt;)\s*color\s*=\s*#([0-9a-f]{6})\s*(?:>|&gt;)/gi,(_,hex)=>'<span style="color:#'+hex+'">');
 value=value.replace(/(?:<|&lt;)\s*\/color\s*(?:>|&gt;)/gi,'</span>');
 return value;
}
function sanitizeArticleHtml(input){
 input=normalizeLegacyRokMarkup(input);
 const allowed=new Set(['p','br','strong','b','em','i','u','ul','ol','li','h2','h3','blockquote','div','span','h1','h4','font']);
 const rename={div:'p',h1:'h2',h4:'h3'};
 const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 const tags=/<[^>]*>/g;let pos=0,out='',stack=[];
 for(const m of input.matchAll(tags)){
  const raw=m[0],v=raw.match(/^<\s*(\/)?\s*([a-z][a-z0-9]*)(?:\s+[^<>]*?)?\s*(\/)?\s*>$/i);
  if(!v)throw Error('Invalid HTML tag. Check for broken markup.');
  const name=v[2].toLowerCase();
  if(!allowed.has(name))throw Error('Unsupported HTML tag: <'+name+'>. Remove it before publishing.');
  const closing=!!v[1],self=!!v[3],safe=rename[name]||name;
  out+=esc(input.slice(pos,m.index));pos=m.index+raw.length;
  if(name==='br'){if(closing)throw Error('Invalid BR tag');out+='<br>';continue}
  if(self)throw Error('Self-closing formatting tag not supported');
  if(closing){if(stack.pop()!==name)throw Error('HTML tags must be correctly nested');out+='</'+(name==='font'?'span':safe)+'>'}
  else{
   stack.push(name);
   if(name==='span'||name==='font'){
    const style=raw.match(/\bstyle\s*=\s*["']([^"']*)["']/i)?.[1]||'';
    const cssColor=style.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)(?:\s*;|\s*$)/i)?.[1];
    const fontColor=raw.match(/\bcolor\s*=\s*["']?(#[0-9a-f]{3}(?:[0-9a-f]{3})?)/i)?.[1];
    const color=cssColor||fontColor;
    out+='<span'+(color?' style="color:'+color.toLowerCase()+'"':'')+'>';
   }else out+='<'+safe+'>';
  }
 }
 const tail=input.slice(pos);
 if(tail.includes('<')||tail.includes('>'))throw Error('Invalid HTML syntax');
 out+=esc(tail);
 if(stack.length)throw Error('Close all formatting tags before publishing');
 if(out.length>60000)throw Error('Article too long');return out;
}
// V3.13.9 — Images are private R2 objects; public reads require a published article.
const IMAGE_TYPES={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
async function articleImage(req,env,url,p){
 const m=p.match(/^\/api\/herald\/articles\/(\d+)\/image$/);
 if(!m)return json({error:'Not found'},404);
 const id=Number(m[1]);
 if(!env.HERALD_DB||!env.HERALD_IMAGES)return json({error:'Image storage not configured'},503);
 const session=await open(env,getCookie(req,SESS));if(!validSession(session))return json({error:'Reporter login required'},401);
 if(!sameOrigin(req,url))return json({error:'Invalid origin'},403);
 if(!['POST','DELETE'].includes(req.method))return json({error:'Method not allowed'},405);
 const article=await env.HERALD_DB.prepare('SELECT id FROM herald_articles WHERE id=?').bind(id).first();
 if(!article)return json({error:'Article not found'},404);
 const previous=await env.HERALD_DB.prepare('SELECT object_key FROM herald_article_images WHERE article_id=?').bind(id).first();
 if(req.method==='DELETE'){
  await env.HERALD_DB.prepare('DELETE FROM herald_article_images WHERE article_id=?').bind(id).run();
  await audit(env.HERALD_DB,id,session.id,'update');
  if(previous?.object_key)try{await env.HERALD_IMAGES.delete(previous.object_key)}catch(e){console.error('R2 cleanup',e)}
  return json({ok:true,has_image:false});
 }
 const type=(req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 if(!IMAGE_TYPES[type])return json({error:'Choose a JPG, PNG, WebP or GIF image'},415);
 const size=Number(req.headers.get('content-length'));
 if(Number.isFinite(size)&&size>5*1024*1024)return json({error:'Maximum image size is 5 MB'},413);
 const bytes=await req.arrayBuffer();
 if(!bytes.byteLength||bytes.byteLength>5*1024*1024)return json({error:'Maximum image size is 5 MB'},413);
 const b=new Uint8Array(bytes);
 const valid=type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:
  type==='image/png'?b.slice(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i]):
  type==='image/gif'?String.fromCharCode(...b.slice(0,6)).match(/^GIF8[79]a$/):
  b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 if(!valid)return json({error:'Image file does not match its format'},422);
 const key=`articles/${id}/${crypto.randomUUID()}.${IMAGE_TYPES[type]}`;
 await env.HERALD_IMAGES.put(key,bytes,{httpMetadata:{contentType:type}});
 try{
  await env.HERALD_DB.prepare('INSERT INTO herald_article_images(article_id,object_key,content_type,byte_size,updated_by_discord_id) VALUES(?,?,?,?,?) ON CONFLICT(article_id) DO UPDATE SET object_key=excluded.object_key,content_type=excluded.content_type,byte_size=excluded.byte_size,updated_by_discord_id=excluded.updated_by_discord_id,updated_at=CURRENT_TIMESTAMP').bind(id,key,type,bytes.byteLength,session.id).run();
  await audit(env.HERALD_DB,id,session.id,'update');
 }catch(e){await env.HERALD_IMAGES.delete(key);throw e}
 if(previous?.object_key)try{await env.HERALD_IMAGES.delete(previous.object_key)}catch(e){console.error('R2 cleanup',e)}
 return json({ok:true,has_image:true,image_url:`/api/herald/images/${id}?v=${encodeURIComponent(key.split('/').pop())}`});
}
async function serveArticleImage(req,env,p){
 if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Method not allowed'},405);
 if(!env.HERALD_DB||!env.HERALD_IMAGES)return json({error:'Image unavailable'},503);
 const id=Number(p.match(/^\/api\/herald\/images\/(\d+)$/)?.[1]);if(!id)return json({error:'Not found'},404);
 const row=await env.HERALD_DB.prepare("SELECT i.object_key,i.content_type FROM herald_article_images i JOIN herald_articles a ON a.id=i.article_id WHERE i.article_id=? AND a.status='published'").bind(id).first();
 if(!row)return json({error:'Not found'},404);
 const obj=await env.HERALD_IMAGES.get(row.object_key);if(!obj)return json({error:'Not found'},404);
 return new Response(req.method==='HEAD'?null:obj.body,{headers:{'content-type':row.content_type,'content-disposition':'inline','x-content-type-options':'nosniff','cache-control':'public, max-age=300','content-security-policy':"default-src 'none'; sandbox"}});
}
async function publicNews(req,env,url,p){
 if(req.method!=='GET')return json({error:'Method not allowed'},405);
 if(!env.HERALD_DB)return json({error:'News service unavailable'},503);
 try{
  const id=p.match(/^\/api\/herald\/public\/articles\/(\d+)$/);
  if(id){const a=await env.HERALD_DB.prepare("SELECT a.id,a.slug,a.title,a.summary,a.category,a.body_html,a.author_display_name,a.published_at,CASE WHEN i.article_id IS NULL THEN 0 ELSE 1 END AS has_image FROM herald_articles a LEFT JOIN herald_article_images i ON i.article_id=a.id WHERE a.id=? AND a.status='published'").bind(Number(id[1])).first();return a?json({article:a}):json({error:'Not found'},404)}
  const r=await env.HERALD_DB.prepare("SELECT id,slug,title,summary,category,author_display_name,published_at FROM herald_articles WHERE status='published' ORDER BY published_at DESC LIMIT 60").all();return json({articles:r.results||[]});
 }catch(e){console.error('Public Herald D1 error',e);return json({error:'News service unavailable'},503)}
}
// Public, read-only carousel: selected published articles only, in slot order.
async function publicPulse(req,env){
 if(req.method!=='GET')return json({error:'Method not allowed'},405);
 if(!env.HERALD_DB)return json({error:'News service unavailable'},503);
 try{
  const r=await env.HERALD_DB.prepare("SELECT s.slot,a.id,a.title,a.summary,a.category,a.published_at FROM herald_pulse_slots s JOIN herald_articles a ON a.id=s.article_id WHERE a.status='published' ORDER BY s.slot ASC LIMIT 4").all();
  return json({articles:r.results||[]});
 }catch(e){console.error('Public Pulse error',e);return json({error:'News service unavailable'},503)}
}
async function managePulse(req,env,url){
 const session=await open(env,getCookie(req,SESS));if(!validSession(session))return json({error:'Reporter login required'},401);
 if(!env.HERALD_DB)return json({error:'D1 binding missing'},503);
 const db=env.HERALD_DB;
 if(req.method==='GET'){
  const [published,slots]=await Promise.all([
   db.prepare("SELECT id,title,summary,category,published_at FROM herald_articles WHERE status='published' ORDER BY published_at DESC LIMIT 150").all(),
   db.prepare("SELECT slot,article_id FROM herald_pulse_slots ORDER BY slot").all()
  ]);
  return json({articles:published.results||[],slots:slots.results||[]});
 }
 if(req.method!=='PUT')return json({error:'Method not allowed'},405);
 if(!sameOrigin(req,url))return json({error:'Invalid request origin'},403);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return json({error:'JSON required'},415);
 let payload;try{payload=await req.json()}catch{return json({error:'Invalid JSON'},400)}
 const ids=payload?.article_ids;
 if(!Array.isArray(ids)||ids.length>4||ids.some(id=>!Number.isSafeInteger(id)||id<=0)||new Set(ids).size!==ids.length)return json({error:'Select up to four distinct published articles'},400);
 try{
  if(ids.length){const placeholders=ids.map(()=>'?').join(',');const check=await db.prepare(`SELECT id FROM herald_articles WHERE status='published' AND id IN (${placeholders})`).bind(...ids).all();if((check.results||[]).length!==ids.length)return json({error:'Only published articles may be selected'},409)}
  // Delete then insert as a single D1 batch: no half-updated ticker.
  const statements=[db.prepare('DELETE FROM herald_pulse_slots'),...ids.map((id,i)=>db.prepare('INSERT INTO herald_pulse_slots(slot,article_id,updated_by_discord_id) VALUES(?,?,?)').bind(i+1,id,session.id))];
  await db.batch(statements);
  for(const id of ids)await audit(db,id,session.id,'pulse_reorder');
  return json({ok:true,article_ids:ids});
 }catch(e){console.error('Pulse manager error',e);return json({error:'Could not save Pulse selection'},500)}
}
async function editorial(req,env,url,p){
 const session=await open(env,getCookie(req,SESS));if(!validSession(session))return json({error:'Reporter login required'},401);
 if(!env.HERALD_DB)return json({error:'D1 binding HERALD_DB missing'},503);
 const db=env.HERALD_DB,method=req.method;
 if(method!=='GET'&&!sameOrigin(req,url))return json({error:'Invalid request origin'},403);
 const match=p.match(/^\/api\/herald\/articles\/(\d+)$/);
 try{
  if(p==='/api/herald/articles'&&method==='GET'){
   const result=await db.prepare('SELECT id,slug,title,summary,category,status,author_display_name,created_at,updated_at,published_at FROM herald_articles ORDER BY updated_at DESC LIMIT 150').all();return json({articles:result.results||[]});
  }
  if(match&&method==='POST'){
   const id=Number(match[1]);
   if(!sameOrigin(req,url))return json({error:'Invalid origin'},403);
   const action=req.headers.get('x-herald-action');
   if(!['publish','unpublish','archive'].includes(action))return json({error:'Unknown action'},400);
   const old=await db.prepare('SELECT status,body_html,title FROM herald_articles WHERE id=?').bind(id).first();
   if(!old)return json({error:'Not found'},404);
   if(action==='publish'){
    if(old.status!=='draft')return json({error:'Only drafts can be published'},409);
    let safe;try{safe=sanitizeArticleHtml(old.body_html||'')}catch(e){return json({error:e.message},422)}
    if(!safe.trim())return json({error:'Article content is required'},400);
    await db.prepare("UPDATE herald_articles SET body_html=?,status='published',published_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND status='draft'").bind(safe,id).run();
   }else if(action==='unpublish'){
    if(old.status!=='published')return json({error:'Only published articles can be unpublished'},409);
    await db.prepare("UPDATE herald_articles SET status='draft',published_at=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(id).run();
    await db.prepare('DELETE FROM herald_pulse_slots WHERE article_id=?').bind(id).run();
   }else{
    if(old.status==='archived')return json({error:'Already archived'},409);
    await db.prepare("UPDATE herald_articles SET status='archived',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(id).run();
    await db.prepare('DELETE FROM herald_pulse_slots WHERE article_id=?').bind(id).run();
   }
   await audit(db,id,session.id,action);return json({ok:true,id,status:action==='publish'?'published':action==='unpublish'?'draft':'archived'});
  }
  if(match&&method==='GET'){
   const item=await db.prepare('SELECT a.*,CASE WHEN i.article_id IS NULL THEN 0 ELSE 1 END AS has_image FROM herald_articles a LEFT JOIN herald_article_images i ON i.article_id=a.id WHERE a.id=?').bind(Number(match[1])).first();return item?json({article:item}):json({error:'Not found'},404);
  }
  if((p==='/api/herald/articles'&&method==='POST')||(match&&method==='PUT')){
   if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json({error:'JSON required'},415);
   const body=await req.text();if(body.length>75000)return json({error:'Payload too large'},413);
   let data;try{data=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}
   const title=cleanText(data.title,140),summary=cleanText(data.summary,500),category=cleanText(data.category,60)||'Kingdom News',html=safeBody(data.body_html);
   if(!title)return json({error:'Headline required'},400);
   if(p==='/api/herald/articles'){
    const slug=slugify(title)+'-'+crypto.randomUUID().slice(0,8);
    const result=await db.prepare('INSERT INTO herald_articles(slug,title,summary,body_html,category,status,author_discord_id,author_display_name) VALUES(?,?,?,?,?,?,?,?)').bind(slug,title,summary,html,category,'draft',session.id,session.global_name||session.username||'Reporter').run();
    const id=result.meta.last_row_id;await audit(db,id,session.id,'create');return json({ok:true,id,status:'draft'},201);
   }
   const id=Number(match[1]),old=await db.prepare('SELECT status FROM herald_articles WHERE id=?').bind(id).first();if(!old)return json({error:'Not found'},404);
   if(old.status!=='draft')return json({error:'Only drafts can be edited in this release'},409);
   await db.prepare("UPDATE herald_articles SET title=?,summary=?,body_html=?,category=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(title,summary,html,category,id).run();await audit(db,id,session.id,'update');return json({ok:true,id,status:'draft'});
  }
  return json({error:'Method not allowed or publishing not yet enabled'},405);
 }catch(e){console.error('Herald D1 API error',e?.message||e);return json({error:'Database operation failed'},500)}
}

export default {async fetch(req,env){
 const url=new URL(req.url),p=url.pathname;
 // Block direct access to the admin dashboard static asset.
 if(p==='/news/admin/dashboard.html')return json({error:'Not found'},404);
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
 if(/^\/api\/herald\/images\/\d+$/.test(p))return serveArticleImage(req,env,p);
 if(p==='/api/herald/public/pulse')return publicPulse(req,env);
 if(p==='/api/herald/public/articles'||/^\/api\/herald\/public\/articles\/\d+$/.test(p))return publicNews(req,env,url,p);
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
 if(p==='/api/herald/public/pulse')return publicPulse(req,env);
 if(p==='/api/herald/public/articles'||/^\/api\/herald\/public\/articles\/\d+$/.test(p))return publicNews(req,env,url,p);
 if(/^\/api\/herald\/articles\/\d+\/image$/.test(p))return articleImage(req,env,url,p);
 if(p==='/api/herald/pulse')return managePulse(req,env,url);
 if(p==='/api/herald/articles'||/^\/api\/herald\/articles\/\d+$/.test(p))return editorial(req,env,url,p);
 return json({error:'Not found'},404);
}};
