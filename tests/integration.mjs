import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4321';
const url = new URL(base);
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Integration checks are restricted to local preview.');
async function request(path, method = 'GET', body, extra = {}) {
  const response = await fetch(base + path, { method, headers: { Origin: base, ...(body ? {'Content-Type':'application/json'} : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
  return { response, data };
}
const session = await request('/api/admin/session');
assert.equal(session.data.local, true, 'Never run synthetic writes against production');
let checks = 0;
for (const route of ['/', '/about/', '/academy/', '/services/', '/services/bridal-makeup/', '/portfolio/', '/contact/', '/privacy/', '/admin/']) {
  const {response,data} = await request(route);
  assert.equal(response.status,200,route);assert.match(data,/SandhyaVermaMakeovers/);checks++;
}
const contact = await request('/contact/');
assert.match(contact.data,/10:00 AM–5:00 PM/);assert.match(contact.data,/devanshrao135@gmail\.com/);checks++;
const portfolio = await request('/portfolio/');
assert.match(portfolio.data,/portfolio-cosmetics\.webp/);assert.match(portfolio.data,/videos\.pexels\.com\/video-files/);checks++;
const home = await request('/');
assert.match(home.data,/hero-portfolio-image/);assert.match(home.data,/Featured makeup portfolio work/);checks++;
const rejected = await request('/api/enquiries','POST',{name:'Synthetic'});
assert.equal(rejected.response.status,400);checks++;
const invalidOrigin = await request('/api/enquiries','POST',{}, {Origin:'https://untrusted.example'});
assert.equal(invalidOrigin.response.status,403);checks++;
const created = await request('/api/enquiries','POST',{name:'LOCAL TEST — not a customer',phone:'9876543210',email:'',interest:'Academy courses',date:'',message:'Synthetic integration check. No external notification.',contactConsent:true,marketingConsent:false,website:''});
assert.equal(created.response.status,201);checks++;
const inbox = await request('/api/admin/enquiries');
assert(inbox.data.items.some(item=>item.id===created.data.id));checks++;
assert.equal((await request('/api/admin/enquiries','PATCH',{id:created.data.id,status:'contacted'})).response.status,200);checks++;
const current = await request('/api/admin/content');
assert.equal(current.data.content.openingHours,'10:00 AM–5:00 PM');assert.equal(current.data.content.email,'devanshrao135@gmail.com');checks++;
const save = await request('/api/admin/content','PUT',{content:current.data.content,version:current.data.version});
assert.equal(save.response.status,200);checks++;
const stale = await request('/api/admin/content','PUT',{content:current.data.content,version:current.data.version});
assert.equal(stale.response.status,409);checks++;
const publish = await request('/api/admin/publications','POST');
assert.equal(publish.response.status,503);checks++;
const privateBuild = await request('/api/build/snapshot');
assert.equal(privateBuild.response.status,401);checks++;
const invalidUpload = await fetch(base+'/api/admin/media',{method:'POST',headers:{Origin:base,'Content-Type':'image/png'},body:'not an image'});
assert.equal(invalidUpload.status,400);checks++;
console.log(checks + ' integration checks passed. One clearly labelled synthetic enquiry remains in the local database.');
