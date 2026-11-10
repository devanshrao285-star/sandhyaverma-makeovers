import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnquiry, createEnquiryService } from '../backend/src/modules/enquiries/service';
import { validateContent, offerActive, ValidationError } from '../backend/src/modules/content/model';
import { requireAdmin, sameOrigin, isLocal, type Env } from '../backend/src/adapters/security';
import seed from '../frontend/src/data/seed.json';
const valid={name:'Preview Test',phone:'9876543210',email:'',date:'2027-01-01',interest:'Bridal makeup',message:'Synthetic test only',contactConsent:true,marketingConsent:false};
test('normalizes phone and preserves separate marketing choice',()=>{const e=parseEnquiry(valid);assert.equal(e.phone,'+919876543210');assert.equal(e.marketingConsent,false);});
test('rejects missing consent, invalid phone, invalid dates and excessive messages',()=>{
 for(const change of [{contactConsent:false},{phone:'123'},{date:'2027-02-30'},{message:'x'.repeat(1501)}])assert.throws(()=>parseEnquiry({...valid,...change}));
});
test('returns success only after repository persistence',async()=>{
 let stored=false;
 const service=createEnquiryService({save:async()=>{stored=true;}},()=>new Date('2026-11-07T00:00:00Z'),()=> 'test-id');
 assert.deepEqual(await service(valid),{id:'test-id'});assert.equal(stored,true);
 const failed=createEnquiryService({save:async()=>{throw new Error('database unavailable');}},()=>new Date(),()=> 'test-id');
 await assert.rejects(failed(valid),/database unavailable/);
});
test('validates content and prevents negative/fractional paise and duplicate slugs',()=>{
 assert.equal(validateContent(seed).brand,'SandhyaVermaMakeovers');
 for(const price of [-1,0.5]){const data=structuredClone(seed);(data.services[0] as {price:number|null}).price=price;assert.throws(()=>validateContent(data));}
 const duplicate=structuredClone(seed);duplicate.services.push(duplicate.services[0]);assert.throws(()=>validateContent(duplicate),/unique/);
 for(const field of ['courses','gallery'])assert.throws(()=>validateContent({...seed,[field]:[null]}),ValidationError);
 assert.throws(()=>validateContent({...seed,offer:{...seed.offer,enabled:true,endsAt:'2027-02-30'}}),ValidationError);
 assert.throws(()=>validateContent({...seed,videos:[{id:'showreel',title:'Showreel',category:'Studio',embedUrl:'https://example.com/embed/video'}]}),ValidationError);
 const reel=structuredClone(seed);reel.videos=[{id:'showreel',title:'Showreel',category:'Studio',embedUrl:'https://www.instagram.com/reel/De2HXGOhxSM/?utm_source=ig_web_copy_link'}];assert.equal(validateContent(reel).videos[0].embedUrl,'https://www.instagram.com/reel/De2HXGOhxSM/embed/');
});
test('offers expire at end of the date in India',()=>{
 const offer={enabled:true,title:'Example',description:'',endsAt:'2026-11-07'};
 assert.equal(offerActive(offer,new Date('2026-11-07T18:29:59Z')),true);
 assert.equal(offerActive(offer,new Date('2026-11-07T18:30:00Z')),false);
 assert.equal(offerActive({...offer,endsAt:'2026-02-30'},new Date('2026-01-01')),false);
});
test('production cannot use local admin bypass or unconfigured Access',async()=>{
 const env={ENVIRONMENT:'production',LOCAL_ADMIN:'true'} as Env;
 const request=new Request('https://studio.example/api/admin/session');
 assert.equal(isLocal(request,env),false);await assert.rejects(requireAdmin(request,env),/not been configured/);
});
test('local admin bypass requires both loopback host and local environment',async()=>{
 assert.equal(await requireAdmin(new Request('http://127.0.0.1/api/admin/session'),{ENVIRONMENT:'local',LOCAL_ADMIN:'true'} as Env),'local-preview');
 await assert.rejects(requireAdmin(new Request('https://studio.example/api/admin/session'),{ENVIRONMENT:'local',LOCAL_ADMIN:'true'} as Env));
});
test('mutations reject foreign origins',()=>{
 const env={ENVIRONMENT:'production',SITE_ORIGIN:'https://studio.example'} as Env;
 assert.throws(()=>sameOrigin(new Request('https://studio.example/api/admin/content',{headers:{Origin:'https://evil.example'}}),env));
 assert.doesNotThrow(()=>sameOrigin(new Request('https://studio.example/api/admin/content',{headers:{Origin:'https://studio.example'}}),env));
});
