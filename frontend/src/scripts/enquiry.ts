interface Turnstile { render: (el: HTMLElement, options: {sitekey: string}) => string; getResponse: (id: string) => string; reset: (id: string) => void }
export {};
declare global { interface Window { turnstile?: Turnstile } }
const turnstileReady = () => new Promise<void>((resolve,reject) => {
 if (window.turnstile) { resolve(); return; }
 const existing=document.querySelector<HTMLScriptElement>('script[data-turnstile]');
 if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(),{once:true});return;}
 const script=document.createElement('script');script.dataset.turnstile='true';script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.onload=()=>resolve();script.onerror=()=>reject();document.head.append(script);
});
document.querySelectorAll<HTMLFormElement>('[data-enquiry]').forEach(form => {
 const status = form.querySelector<HTMLElement>('.form-status')!;
 const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
 let ready = false; let widget = ''; let local = false;
 const query = new URLSearchParams(location.search).get('interest');
 if (query) { const s = form.elements.namedItem('interest') as HTMLSelectElement; if (Array.from(s.options).some(o=>o.value===query)) s.value = query; }
 const date = form.elements.namedItem('date') as HTMLInputElement;
 date.min = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 fetch('/api/config').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(async (config) => {
  local = config.local;
  if (local) { ready = true; status.textContent = 'Local preview: enquiries are saved only on this computer.'; return; }
  if (!config.turnstileSiteKey) throw new Error();
  await turnstileReady();
  widget=window.turnstile!.render(form.querySelector<HTMLElement>('.turnstile-container')!,{sitekey:config.turnstileSiteKey}); ready=true;
 }).catch(()=>{status.textContent='Enquiries are not connected in this preview. Please do not enter personal information yet.';});
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready) {status.textContent='The enquiry service is not connected yet. Please try again later.';return;}
  const data = new FormData(form);
  const token = local ? '' : window.turnstile?.getResponse(widget) || '';
  if (!local && !token) {status.textContent='Please complete the security check.';return;}
  const payload = Object.fromEntries(data); Object.assign(payload,{contactConsent:data.has('contactConsent'),marketingConsent:data.has('marketingConsent'),message:data.get('message')||'',token});
  button.disabled=true; status.textContent='Sending your enquiry…';
  try {
   const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const result=await response.json();
   if(!response.ok) throw new Error(result.error || 'We could not save your enquiry. Please try again.');
   form.reset(); status.textContent=local ? 'Saved to the local preview inbox. No message has been sent to the business.' : 'Thank you. Your enquiry has been received. The team will contact you about availability.';
  } catch(error) {status.textContent=error instanceof Error ? error.message : 'Please try again shortly.';}
  finally {button.disabled=false;if(widget)window.turnstile?.reset(widget);}
 });
});
