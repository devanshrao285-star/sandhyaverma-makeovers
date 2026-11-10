import { HttpError } from './security';
import type { Env } from './security';
export const STORAGE_LIMIT=2_000_000_000;
export const WRITE_LIMIT=100_000;
export const READ_LIMIT=1_000_000;
// UTC calendar month matches R2 calendar-month usage. Reconfirm against account billing before launch.
function month(){return new Date().toISOString().slice(0,7);}
async function reserve(db:D1Database,key:string,amount:number,limit:number) {
 const row=await db.prepare('INSERT INTO budgets (key,amount) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET amount=amount+excluded.amount WHERE amount+excluded.amount<=? RETURNING amount').bind(key,amount,limit).first();
 if(!row)throw new HttpError(429,'The studio media budget has been reached. New media activity is paused.');
}
export async function readMedia(id:string,env:Env) {
 const media=await env.DB.prepare("SELECT * FROM media WHERE id=? AND state='ready'").bind(id).first<{object_key:string;mime:string}>();
 if(!media)throw new HttpError(404,'Image not found.');
 await reserve(env.DB,'read:'+month(),1,READ_LIMIT);
 const object=await env.MEDIA.get(media.object_key);
 if(!object)throw new HttpError(404,'Image is unavailable.');
 return new Response(object.body,{headers:{'Content-Type':media.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
export async function uploadMedia(request:Request,env:Env) {
 const type=request.headers.get('Content-Type')?.split(';')[0];
 if(!['image/jpeg','image/png','image/webp'].includes(type||''))throw new HttpError(415,'Upload a JPEG, PNG or WebP image.');
 const name=(request.headers.get('X-File-Name')||'Studio image').slice(0,100);
 const declared=Number(request.headers.get('Content-Length'));
 if(declared>2_000_000)throw new HttpError(413,'Compress the image below 2 MB.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Missing image.');
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2_000_000){await reader.cancel();throw new HttpError(413,'Compress the image below 2 MB.');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const signature=type==='image/jpeg' ? bytes[0]===255&&bytes[1]===216&&bytes[2]===255 : type==='image/png' ? bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71 : new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 if(!signature||length<20)throw new HttpError(400,'The file is not a supported image.');
 // Conservative reservations deliberately remain after uncertain failures; owner can reconcile them.
 await reserve(env.DB,'photo-count',1,500);
 await reserve(env.DB,'storage',length,STORAGE_LIMIT);
 await reserve(env.DB,'write:'+month(),1,WRITE_LIMIT);
 const id=crypto.randomUUID();const key='sources/'+id;
 await env.DB.prepare('INSERT INTO media (id,object_key,name,bytes,mime,state,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,key,name,length,type,'pending',new Date().toISOString()).run();
 await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});
 await env.DB.prepare("UPDATE media SET state='ready' WHERE id=?").bind(id).run();
 return {id,name,bytes:length};
}

export async function deleteMedia(id:string,env:Env) {
 const media=await env.DB.prepare("SELECT object_key,bytes FROM media WHERE id=? AND state='ready'").bind(id).first<{object_key:string;bytes:number}>();
 if(!media)throw new HttpError(404,'Image not found.');
 await env.MEDIA.delete(media.object_key);
 await env.DB.batch([
  env.DB.prepare('DELETE FROM media WHERE id=?').bind(id),
  env.DB.prepare("UPDATE budgets SET amount=MAX(0,amount-?) WHERE key='storage'").bind(media.bytes),
  env.DB.prepare("UPDATE budgets SET amount=MAX(0,amount-1) WHERE key='photo-count'")
 ]);
 return {ok:true};
}
