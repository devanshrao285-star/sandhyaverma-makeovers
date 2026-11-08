import { content, launchReady } from '../data/content';
export function GET({site}: {site: URL}) {
 const paths=launchReady ? ['','about/','academy/','services/','portfolio/','contact/',...content.services.map(s=>'services/'+s.id+'/')] : [];
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>'+new URL(p,site)+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml'}});
}
