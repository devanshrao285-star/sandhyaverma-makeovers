import seed from '../../../frontend/src/data/seed.json';
import { validateContent, ValidationError } from '../modules/content/model';
import { createEnquiryService } from '../modules/enquiries/service';
import { d1Enquiries } from '../adapters/enquiries';
import { HttpError, isLocal, requireAdmin, requireBuild, sameOrigin, bodyJson, rateLimit, verifyBot, type Env } from '../adapters/security';
import { deleteMedia, readMedia, uploadMedia } from '../adapters/media';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const normalizeContent=(value:unknown)=>{const content=value as Record<string,unknown>;return {...content,openingHours:typeof content.openingHours==='string'&&content.openingHours.trim()?content.openingHours:'10:00 AM–5:00 PM',home:content.home||seed.home,about:content.about||seed.about||{},videos:Array.isArray(content.videos)?content.videos:[],testimonials:Array.isArray(content.testimonials)?content.testimonials:[]};};
export async function handleApi(request:Request,env:Env):Promise<Response> {
 try {
  const path=new URL(request.url).pathname.replace(/\/$/,'');
  const method=request.method;
  if(path==='/api/config'&&method==='GET')return json({local:isLocal(request,env),turnstileSiteKey:env.FORM_ENABLED==='true'?env.TURNSTILE_SITE_KEY||'':''});
  if(path==='/api/enquiries'&&method==='POST'){
   sameOrigin(request,env);
   if(!isLocal(request,env)&&env.FORM_ENABLED!=='true')throw new HttpError(503,'Enquiries are not open yet.');
   const body=await bodyJson(request,8000);
   if(body.website)throw new HttpError(400,'Unable to accept this submission.');
   await rateLimit(request,env);await verifyBot(body.token,request,env);
   const result=await createEnquiryService(d1Enquiries(env.DB),()=>new Date(),()=>crypto.randomUUID())(body);
   return json(result,201);
  }
  if(path.startsWith('/api/build/')){
   await requireBuild(request,env);
   if(method!=='GET')throw new HttpError(405,'Method not allowed.');
   if(path==='/api/build/snapshot'){
    const row=await env.DB.prepare("SELECT id,body FROM publications WHERE status IN ('requested','queued') ORDER BY created_at DESC LIMIT 1").first<{id:string;body:string}>();
    if(!row)throw new HttpError(404,'No publication is ready.');
    return json({revision:row.id,content:JSON.parse(row.body)});
   }
   if(path.startsWith('/api/build/media/'))return readMedia(path.split('/').pop()!,env);
   throw new HttpError(404,'Not found.');
  }
  if(!path.startsWith('/api/admin/'))throw new HttpError(404,'Not found.');
  const identity=await requireAdmin(request,env);
  if(!['GET','HEAD'].includes(method))sameOrigin(request,env);
  if(path==='/api/admin/session'&&method==='GET')return json({identity,local:isLocal(request,env)});
  if(path==='/api/admin/enquiries'){
   if(method==='GET'){
    const url=new URL(request.url);const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0));
    const rows=await env.DB.prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 50 OFFSET ?').bind(offset).all();
    return json({items:rows.results,offset,next:rows.results.length===50?offset+50:null});
   }
   if(method==='PATCH'){
    const body=await bodyJson(request);
    if(typeof body.id!=='string'||!['new','contacted','qualified','closed'].includes(String(body.status)))throw new HttpError(400,'Invalid status.');
    const row=await env.DB.prepare('UPDATE enquiries SET status=? WHERE id=? RETURNING id').bind(body.status,body.id).first();
    if(!row)throw new HttpError(404,'Enquiry not found.');return json({ok:true});
   }
  }
  if(path==='/api/admin/content'){
   if(method==='GET'){
    const draft=await env.DB.prepare('SELECT body,version FROM content_drafts WHERE id=1').first<{body:string;version:number}>();
    return json({content:draft?normalizeContent(JSON.parse(draft.body)):seed,version:draft?.version||0});
   }
   if(method==='PUT'){
    const body=await bodyJson(request,80000);const content=validateContent(body.content);
    if(!Number.isInteger(body.version)||Number(body.version)<0)throw new HttpError(400,'Invalid content version.');
    let row;
    if(body.version===0)row=await env.DB.prepare('INSERT INTO content_drafts (id,body,version,updated_at) VALUES (1,?,1,?) ON CONFLICT(id) DO NOTHING RETURNING version').bind(JSON.stringify(content),new Date().toISOString()).first();
    else row=await env.DB.prepare('UPDATE content_drafts SET body=?,version=version+1,updated_at=? WHERE id=1 AND version=? RETURNING version').bind(JSON.stringify(content),new Date().toISOString(),body.version).first();
    if(!row)throw new HttpError(409,'Someone changed this draft. Reload before editing.');
    return json(row);
   }
  }
  if(path==='/api/admin/media'){
   if(method==='GET'){const rows=await env.DB.prepare("SELECT id,name,bytes,created_at FROM media WHERE state='ready' ORDER BY created_at DESC LIMIT 500").all();const budgets=await env.DB.prepare('SELECT * FROM budgets ORDER BY key').all();return json({items:rows.results,budgets:budgets.results});}
   if(method==='POST')return json(await uploadMedia(request,env),201);
  }
  if(path.startsWith('/api/admin/media/')){
   const mediaId=path.split('/').pop()!;
   if(method==='GET')return readMedia(mediaId,env);
   if(method==='DELETE'){
    const draft=await env.DB.prepare('SELECT body FROM content_drafts WHERE id=1').first<{body:string}>();
    if(draft){
     const content=JSON.parse(draft.body) as {home?:{mediaId?:string};about?:{mediaId?:string};gallery?:Array<{mediaId?:string}>;services?:Array<{mediaId?:string}>;testimonials?:Array<{mediaId?:string}>};
     const inUse=[content.home,content.about,...(content.gallery||[]),...(content.services||[]),...(content.testimonials||[])].some(item=>item?.mediaId===mediaId);
     if(inUse)throw new HttpError(409,'Remove this image from its page placement and save the draft before deleting it from the library.');
    }
    return json(await deleteMedia(mediaId,env));
   }
  }
  if(path==='/api/admin/publications'){
   if(method==='GET'){const rows=await env.DB.prepare('SELECT id,created_at,status FROM publications ORDER BY created_at DESC LIMIT 10').all();return json({items:rows.results});}
   if(method==='POST'){
    if(!env.DEPLOY_HOOK||!env.BUILD_TOKEN)throw new HttpError(503,'Publishing is not configured. Your draft is saved; connect a Pages deploy hook and build token first.');
    const hook=new URL(env.DEPLOY_HOOK);
    if(hook.protocol!=='https:'||hook.hostname!=='api.cloudflare.com'||!hook.pathname.startsWith('/client/v4/pages/webhooks/deploy_hooks/'))throw new HttpError(503,'Invalid publication configuration.');
    const draft=await env.DB.prepare('SELECT body FROM content_drafts WHERE id=1').first<{body:string}>();
    if(!draft)throw new HttpError(400,'Save a draft first.');
    const content=validateContent(JSON.parse(draft.body));
    for(const item of [content.home,content.about,...content.gallery,...content.services,...content.testimonials]){if(item.mediaId){const found=await env.DB.prepare("SELECT id FROM media WHERE id=? AND state='ready'").bind(item.mediaId).first();if(!found)throw new HttpError(400,'An assigned image is missing.');}}
    const key='publish:'+new Date().toISOString().slice(0,7);
    const budget=await env.DB.prepare('INSERT INTO budgets (key,amount) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET amount=amount+1 WHERE amount<100 RETURNING amount').bind(key).first();
    if(!budget)throw new HttpError(429,'The monthly content publication limit is reached.');
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO publications (id,body,created_at,status) VALUES (?,?,?,?)').bind(id,JSON.stringify(content),new Date().toISOString(),'requested').run();
    const result=await fetch(hook,{method:'POST'});
    await env.DB.prepare('UPDATE publications SET status=? WHERE id=?').bind(result.ok?'queued':'failed',id).run();
    if(!result.ok)throw new HttpError(502,'Build could not be queued. The current live website is unchanged.');
    return json({id,status:'queued',message:'Build requested. This is not a deployment confirmation.'},202);
   }
  }
  throw new HttpError(405,'Method not allowed.');
 } catch(error) {
  if(error instanceof HttpError)return json({error:error.message},error.status);
  if(error instanceof ValidationError)return json({error:error.message},400);
  // Deliberately omit input, phone numbers and credentials from logs.
  console.error('API operation failed',error instanceof Error?error.name:'UnknownError');
  return json({error:'The service is temporarily unavailable. Please try again.'},503);
 }
}
