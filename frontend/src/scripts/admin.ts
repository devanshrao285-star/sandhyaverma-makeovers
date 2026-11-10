import type { Content } from '../../../backend/src/modules/content/model';
const status=document.querySelector<HTMLElement>('#admin-status')!;
const contentStatus=document.querySelector<HTMLElement>('#content-status');
const app=document.querySelector<HTMLElement>('#admin-app')!;
const notice=document.querySelector<HTMLElement>('#admin-notice')!;
let draft:Content;let version=0;let offset=0;let nextOffset:number|null=null;
async function api(path:string,options:RequestInit={}) {
 const response=await fetch('/api/admin/'+path,options);
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Admin API is not connected. Use the full local preview or configure Cloudflare Access.');
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Request failed.');return data;
}
function announce(message:string){status.textContent=message;if(contentStatus)contentStatus.textContent=message;}
async function run(action:()=>Promise<void>){announce('Working…');try{await action();}catch(e){announce(e instanceof Error?e.message:'Something went wrong.');}}
function element<K extends keyof HTMLElementTagNameMap>(tag:K,text=''){const el=document.createElement(tag);el.textContent=text;return el;}
function renderFields(){
 const root=document.querySelector('#content-fields')!;root.replaceChildren();
 function field(label:string,value:string,update:(v:string)=>void,type='text'){
  const wrapper=element('label',label);wrapper.className='admin-label';const input=element('input');input.type=type;input.value=value;input.addEventListener('input',()=>{update(input.value);syncJson();});wrapper.append(input);root.append(wrapper);
 }
 function action(label:string,onClick:()=>void){const button=element('button',label);button.type='button';button.className='button button-outline';button.addEventListener('click',onClick);root.append(button);}
 root.append(element('h3','Global details · header, footer & contact page'));
 field('Business name',draft.brand,v=>draft.brand=v);field('Positioning',draft.tagline,v=>draft.tagline=v);
 field('Phone (include country code)',draft.phone,v=>draft.phone=v);field('Email',draft.email,v=>draft.email=v,'email');field('Address',draft.address,v=>draft.address=v);field('Opening hours',draft.openingHours,v=>draft.openingHours=v);
 root.append(element('h3','Homepage hero'));
 field('Hero eyebrow',draft.home.eyebrow,v=>draft.home.eyebrow=v);field('Hero heading',draft.home.title,v=>draft.home.title=v);field('Hero accent line',draft.home.accent,v=>draft.home.accent=v);field('Hero description',draft.home.description,v=>draft.home.description=v);
 root.append(element('h3','Services page · service cards & pricing'));
 draft.services.forEach(s=>{field(s.title+' — title',s.title,v=>s.title=v);field('Description',s.description,v=>s.description=v);field('Price in INR (leave empty for a quote)',s.price===null?'':String(s.price/100),v=>s.price=v.trim()===''?null:Math.round(Number(v)*100),'number');});
 root.append(element('h3','Academy page · courses & batches'));
 draft.courses.forEach(c=>{field(c.title+' — title',c.title,v=>c.title=v);field('Duration / format',c.duration,v=>c.duration=v);field('Next batch',c.batch,v=>c.batch=v);});
 root.append(element('h3','Offer banner · Home page'));
 const toggle=element('label','Show this offer');toggle.className='checkbox';const checkbox=element('input');checkbox.type='checkbox';checkbox.checked=draft.offer.enabled;checkbox.addEventListener('change',()=>{draft.offer.enabled=checkbox.checked;syncJson();});toggle.prepend(checkbox);root.append(toggle);
 field('Offer title',draft.offer.title,v=>draft.offer.title=v);field('Offer description',draft.offer.description,v=>draft.offer.description=v);field('Expiry date (India time)',draft.offer.endsAt,v=>draft.offer.endsAt=v,'date');
 root.append(element('h3','Testimonials · Home page'));
 draft.testimonials.forEach((testimonial,index)=>{field('Client name',testimonial.name,v=>testimonial.name=v);field('Occasion / service',testimonial.occasion,v=>testimonial.occasion=v);field('Testimonial',testimonial.quote,v=>testimonial.quote=v);action('Remove testimonial',()=>{draft.testimonials.splice(index,1);renderFields();});});
 action('Add testimonial',()=>{draft.testimonials.push({id:'testimonial-'+crypto.randomUUID().slice(0,8),name:'',occasion:'',quote:'',preview:false});renderFields();});
 root.append(element('h3','Portfolio page · videos'));
 draft.videos.forEach((video,index)=>{field('Video title',video.title,v=>video.title=v);field('Category',video.category,v=>video.category=v);field('YouTube embed, Instagram Reel or Pexels MP4 URL',video.embedUrl,v=>video.embedUrl=v);action('Remove video',()=>{draft.videos.splice(index,1);renderFields();});});
 action('Add video',()=>{draft.videos.push({id:'video-'+crypto.randomUUID().slice(0,8),title:'',category:'Studio work',embedUrl:''});renderFields();});
 syncJson();
}
function syncJson(){document.querySelector<HTMLTextAreaElement>('#content-json')!.value=JSON.stringify(draft,null,2);}
async function loadContent(){const data=await api('content');draft={...data.content,videos:data.content.videos||[],testimonials:(data.content.testimonials||[]).map((item:Content['testimonials'][number])=>({...item,preview:item.preview??false}))};version=data.version;renderFields();announce('Saved content loaded.');}
async function loadLeads(){
 const data=await api('enquiries?offset='+offset);nextOffset=data.next;const root=document.querySelector('#lead-rows')!;root.replaceChildren();
 if(!data.items.length){const tr=element('tr');const td=element('td','No enquiries yet.');td.colSpan=5;tr.append(td);root.append(tr);}
 for(const lead of data.items){
  const tr=element('tr');const received=element('td',new Date(lead.created_at).toLocaleString('en-IN'));
  const customer=element('td',lead.name);customer.append(element('small',lead.phone),element('small',lead.email),element('small',lead.marketing_consent?'Marketing opted in':'Enquiry contact only'));
  const interest=element('td',lead.interest);interest.append(element('small',lead.preferred_date||'No preferred date'));
  const message=element('td',lead.message||'—');const state=element('td');const select=element('select');
  for(const value of ['new','contacted','qualified','closed']){const o=element('option',value);o.value=value;o.selected=value===lead.status;select.append(o);}
  select.setAttribute('aria-label','Status for '+lead.name);
  select.addEventListener('change',()=>run(async()=>{await api('enquiries',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:lead.id,status:select.value})});status.textContent='Enquiry status saved.';}));
  state.append(select);tr.append(received,customer,interest,message,state);root.append(tr);
 }
 document.querySelector<HTMLButtonElement>('#next-leads')!.hidden=nextOffset===null;status.textContent='Enquiry inbox refreshed.';
}
async function loadMedia(){
 const data=await api('media');const root=document.querySelector('#media-items')!;root.replaceChildren();const target=document.querySelector<HTMLSelectElement>('#media-target');
 if(target){target.replaceChildren();const addOption=(value:string,label:string)=>{const option=element('option',label);option.value=value;target.append(option);};addOption('home','Home page · main hero image');addOption('gallery','Portfolio page · gallery and Home carousel');draft.services.forEach(service=>addOption('service:'+service.id,'Services page · '+service.title+' card'));draft.testimonials.forEach((testimonial,index)=>addOption('testimonial:'+testimonial.id,'Home testimonials · '+(testimonial.name||'testimonial '+(index+1))));}
 for(const media of data.items){const card=element('article');card.className='media-card';const img=element('img');img.src='/api/admin/media/'+media.id;img.alt=media.name;img.loading='lazy';
  const placements:string[]=[];
  if(draft.home.mediaId===media.id)placements.push('Home page · main hero image');
  if(draft.gallery.some(g=>g.mediaId===media.id))placements.push('Portfolio gallery · Home carousel');
  draft.services.filter(service=>service.mediaId===media.id).forEach(service=>placements.push('Service · '+service.title));
  draft.testimonials.filter(testimonial=>testimonial.mediaId===media.id).forEach(testimonial=>placements.push('Testimonial · '+(testimonial.name||'unnamed')));
  const placement=element('p',placements.length?'Used in: '+placements.join(' • '):'Not assigned to a page');placement.className='media-placement';
  const add=element('button','Use in selected place');add.className='button button-outline';add.addEventListener('click',()=>{const selected=target?.value||'home';if(selected==='home'){draft.home.mediaId=media.id;delete draft.home.imageUrl;}else if(selected==='gallery'){if(draft.gallery.some(g=>g.mediaId===media.id)){status.textContent='This photo is already in the portfolio.';return;}draft.gallery.push({id:'photo-'+media.id,title:media.name,category:'Studio work',mediaId:media.id});}else if(selected.startsWith('service:')){const service=draft.services.find(item=>item.id===selected.slice(8));if(!service)return;service.mediaId=media.id;delete service.imageUrl;}else if(selected.startsWith('testimonial:')){const testimonial=draft.testimonials.find(item=>item.id===selected.slice(12));if(!testimonial)return;testimonial.mediaId=media.id;delete testimonial.imageUrl;}syncJson();loadMedia();status.textContent='Image assigned. Save draft, then publish to update the website.';});
  const remove=element('button','Remove from selected place');remove.className='button button-outline';remove.addEventListener('click',()=>{const selected=target?.value||'home';let removed=false;if(selected==='home'){if(draft.home.mediaId===media.id){delete draft.home.mediaId;removed=true;}}else if(selected==='gallery'){const before=draft.gallery.length;draft.gallery=draft.gallery.filter(g=>g.mediaId!==media.id);removed=draft.gallery.length!==before;}else if(selected.startsWith('service:')){const service=draft.services.find(item=>item.id===selected.slice(8));if(service&&service.mediaId===media.id){delete service.mediaId;removed=true;}}else if(selected.startsWith('testimonial:')){const testimonial=draft.testimonials.find(item=>item.id===selected.slice(12));if(testimonial&&testimonial.mediaId===media.id){delete testimonial.mediaId;removed=true;}}syncJson();loadMedia();status.textContent=removed?'Image removed from this placement. Save draft to keep the change.':'This image is not used in the selected placement.';});
  const removeLibrary=element('button','Delete from library');removeLibrary.className='button button-outline';removeLibrary.addEventListener('click',()=>{if(!confirm('Delete “'+media.name+'” from the media library? This cannot be undone.'))return;run(async()=>{await api('media/'+media.id,{method:'DELETE'});await loadMedia();status.textContent='Image deleted from the media library.';});});
  const actions=element('div');actions.className='admin-actions';actions.append(add,remove,removeLibrary);
  card.append(img,element('p',media.name),element('p',Math.round(media.bytes/1024)+' KB'),placement,actions);root.append(card);}
 const storage=data.budgets.find((b:{key:string})=>b.key==='storage')?.amount||0;
 document.querySelector('#media-budget')!.textContent='Reserved storage: '+(storage/1000000).toFixed(1)+' MB / 2,000 MB internal ceiling. '+data.items.length+' images. Provider account usage must also be checked.';
}
async function loadPublications(){const data=await api('publications');const root=document.querySelector('#publication-list')!;root.replaceChildren();for(const row of data.items){root.append(element('p',new Date(row.created_at).toLocaleString('en-IN')+' — '+row.status+' — '+row.id));}}
document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll<HTMLElement>('.admin-panel').forEach(p=>p.hidden=p.id!=='panel-'+button.dataset.tab);if(button.dataset.tab==='media')run(async()=>{await loadMedia();status.textContent='Media loaded.';});if(button.dataset.tab==='publish')run(async()=>{await loadPublications();status.textContent='Publication requests loaded.';});}));
document.querySelector('#refresh-leads')?.addEventListener('click',()=>run(async()=>{offset=0;await loadLeads();}));
document.querySelector('#next-leads')?.addEventListener('click',()=>run(async()=>{offset=nextOffset||0;await loadLeads();}));
document.querySelector('#reload-content')?.addEventListener('click',()=>run(loadContent));
document.querySelector('#save-content')?.addEventListener('click',()=>run(async()=>{const data=await api('content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:draft,version})});version=data.version;announce('Draft saved. Select Publish when you are ready to update the live website.');}));
document.querySelector('#apply-json')?.addEventListener('click',()=>run(async()=>{const value=JSON.parse(document.querySelector<HTMLTextAreaElement>('#content-json')!.value);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Enter one JSON content object.');draft=value as Content;renderFields();announce('JSON applied. Save draft to validate and persist it.');}));
function renderUploadPreview(){const files=[...(document.querySelector<HTMLInputElement>('#media-file')?.files||[])];const root=document.querySelector('#upload-preview')!;root.replaceChildren();for(const file of files){const card=element('article');card.className='upload-preview-card';const image=element('img');const url=URL.createObjectURL(file);image.src=url;image.alt='Preview of '+file.name;image.onload=()=>URL.revokeObjectURL(url);card.append(image,element('p',file.name),element('p',Math.round(file.size/1024)+' KB'));root.append(card);}}
document.querySelector('#media-file')?.addEventListener('change',renderUploadPreview);
document.querySelector('#upload-media')?.addEventListener('click',()=>run(async()=>{const input=document.querySelector<HTMLInputElement>('#media-file')!;const files=[...(input.files||[])];if(!files.length)throw new Error('Choose at least one photo first.');for(const file of files){if(file.size>2000000)throw new Error('Compress every photo to less than 2 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose JPEG, PNG or WebP photos only.');}for(let index=0;index<files.length;index++){const file=files[index];announce('Uploading photo '+(index+1)+' of '+files.length+'…');await api('media',{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});}input.value='';document.querySelector('#upload-preview')!.replaceChildren();await loadMedia();status.textContent=files.length+' photo'+(files.length===1?'':'s')+' uploaded privately. Assign each to a placement, save the draft, then publish.';}));
document.querySelector('#publish-content')?.addEventListener('click',()=>run(async()=>{const result=await api('publications',{method:'POST'});await loadPublications();status.textContent=result.message;}));
run(async()=>{const session=await api('session');notice.textContent=session.local?'LOCAL PREVIEW: admin access is enabled only on this computer. No live services or billing are activated.':'Signed in as '+session.identity;app.hidden=false;await loadContent();await loadLeads();}).catch(()=>{});
