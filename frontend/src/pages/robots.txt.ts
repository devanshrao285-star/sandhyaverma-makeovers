import { launchReady } from '../data/content';
export function GET({site}: {site: URL}) {return new Response(launchReady ? 'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: '+new URL('sitemap.xml',site)+'\n' : 'User-agent: *\nDisallow: /\n');}
