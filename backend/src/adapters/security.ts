import { createRemoteJWKSet, jwtVerify } from 'jose';
export interface Env { DB: D1Database; MEDIA: R2Bucket; ENVIRONMENT?: string; LOCAL_ADMIN?: string; ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string; ADMIN_EMAILS?: string; TURNSTILE_SECRET?: string; TURNSTILE_SITE_KEY?: string; BUILD_TOKEN?: string; DEPLOY_HOOK?: string; LIVE_SITE_URL?: string; SITE_ORIGIN?: string; FORM_ENABLED?: string; RATE_SALT?: string }
export class HttpError extends Error { constructor(public status: number, message: string) {super(message);} }
export function isLocal(request: Request, env: Env) {return env.ENVIRONMENT==='local' && ['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname);}
const keysets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function requireAdmin(request: Request, env: Env) {
 if (isLocal(request,env) && env.LOCAL_ADMIN==='true') return 'local-preview';
 if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAILS) throw new HttpError(503,'Admin access has not been configured.');
 const domain=env.ACCESS_TEAM_DOMAIN;
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)) throw new HttpError(503,'Invalid access configuration.');
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token) throw new HttpError(401,'Sign in through the studio’s Cloudflare Access page.');
 try {
  if(!keysets.has(domain))keysets.set(domain,createRemoteJWKSet(new URL('https://'+domain+'/cdn-cgi/access/certs')));
  const {payload}=await jwtVerify(token,keysets.get(domain)!,{issuer:'https://'+domain,audience:env.ACCESS_AUD,algorithms:['RS256']});
  const email=String(payload.email||'').toLowerCase();
  if(!env.ADMIN_EMAILS.toLowerCase().split(',').map(e=>e.trim()).includes(email)) throw new Error();
  return email;
 } catch {throw new HttpError(403,'Your account is not authorized for studio administration.');}
}
export function sameOrigin(request:Request,env:Env) {
 const origin=request.headers.get('Origin');
 const expected=isLocal(request,env) ? new URL(request.url).origin : env.SITE_ORIGIN;
 if(!expected || origin!==expected) throw new HttpError(403,'Request origin was not accepted.');
}
export async function bodyJson(request:Request,max=50000):Promise<Record<string,unknown>> {
 if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'Expected JSON.');
 const reader=request.body?.getReader(); if(!reader)throw new HttpError(400,'Missing body.');
 const chunks:Uint8Array[]=[];let bytes=0;
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();throw new HttpError(413,'Request is too large.');}chunks.push(value);}
 const all=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
 try {const data=JSON.parse(new TextDecoder().decode(all));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();return data;}catch{throw new HttpError(400,'Invalid JSON.');}
}
export async function rateLimit(request: Request,env:Env) {
 const local=isLocal(request,env);
 if(!local&&!env.RATE_SALT)throw new HttpError(503,'Enquiries are not configured.');
 const ip=request.headers.get('CF-Connecting-IP')||'local';
 const hour=Math.floor(Date.now()/3600000);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode((env.RATE_SALT||'local')+':'+ip+':'+hour));
 const key=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
 const row=await env.DB.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,(hour+2)*3600000).first<{count:number}>();
 if(!row||row.count>10)throw new HttpError(429,'Too many enquiries. Please try again in an hour.');
 await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Date.now()).run();
}
export async function verifyBot(token:unknown,request:Request,env:Env) {
 if(isLocal(request,env))return;
 if(!env.TURNSTILE_SECRET||typeof token!=='string'||token.length>2048)throw new HttpError(400,'Security verification is required.');
 const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token})});
 if(!result.ok)throw new HttpError(503,'Security verification is unavailable. Please retry.');
 const data=await result.json() as {success:boolean;hostname?:string};
 if(!data.success||data.hostname!==new URL(request.url).hostname)throw new HttpError(400,'Security verification failed. Please retry.');
}
export async function requireBuild(request:Request,env:Env) {
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!env.BUILD_TOKEN||!token)throw new HttpError(401,'Build authorization required.');
 const digest=(v:string)=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));
 const [a,b]=await Promise.all([digest(token),digest(env.BUILD_TOKEN)]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
 if(diff)throw new HttpError(403,'Build authorization failed.');
}
