export interface Service { id: string; title: string; category: string; description: string; price: number | null; inclusions: string[]; mediaId?: string; imageUrl?: string }
export interface Course { id: string; title: string; description: string; duration: string; batch: string }
export interface GalleryItem { id: string; title: string; category: string; mediaId?: string; imageUrl?: string }
export interface VideoItem { id: string; title: string; category: string; embedUrl: string }
export interface Testimonial { id: string; quote: string; name: string; occasion: string; preview: boolean; mediaId?: string; imageUrl?: string }
export interface HomeContent { eyebrow: string; title: string; accent: string; description: string; mediaId?: string; imageUrl?: string }
export interface Content {
  brand: string; tagline: string; phone: string; email: string; address: string; openingHours: string;
  home: HomeContent;
  services: Service[]; courses: Course[]; gallery: GalleryItem[]; videos: VideoItem[]; testimonials: Testimonial[];
  offer: { title: string; description: string; enabled: boolean; endsAt: string };
}
export class ValidationError extends Error {}
const text = (v: unknown, max: number, required = true): string => {
  if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw new ValidationError('Please check text fields and their length.');
  return v.trim();
};
export function validateContent(value: unknown): Content {
  if (!value || typeof value !== 'object') throw new ValidationError('Content must be an object.');
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.services) || v.services.length > 30 || !Array.isArray(v.courses) || v.courses.length > 20 || !Array.isArray(v.gallery) || v.gallery.length > 100 || !Array.isArray(v.videos) || v.videos.length > 20 || !Array.isArray(v.testimonials) || v.testimonials.length > 30) throw new ValidationError('Content lists exceed the allowed size.');
  const services = v.services.map((s: Service) => {
    if (!s || (s.price !== null && (!Number.isSafeInteger(s.price) || s.price < 0 || s.price > 100000000))) throw new ValidationError('Prices must be integer paise or null.');
    if (!Array.isArray(s.inclusions) || s.inclusions.length > 12) throw new ValidationError('Check service inclusions.');
    const media=mediaReference(s);
    return { id: slug(s.id), title: text(s.title, 100), category: text(s.category, 40), description: text(s.description, 600), price: s.price, inclusions: s.inclusions.map(i => text(i, 150)), ...media };
  });
  const courses = v.courses.map((c: Course) => {
    if (!c || typeof c !== 'object') throw new ValidationError('Invalid course.');
    return { id: slug(c.id), title: text(c.title, 100), description: text(c.description, 600), duration: text(c.duration, 100), batch: text(c.batch, 100) };
  });
  const gallery = v.gallery.map((g: GalleryItem) => {
    if (!g || typeof g !== 'object') throw new ValidationError('Invalid portfolio entry.');
    const media=mediaReference(g,true);
    return { id: slug(g.id), title: text(g.title, 100), category: text(g.category, 40), ...media };
  });
  const videos = v.videos.map((video: VideoItem) => {
    if (!video || typeof video !== 'object') throw new ValidationError('Invalid video.');
    const embedUrl=text(video.embedUrl,500);
    if (!isApprovedEmbed(embedUrl)) throw new ValidationError('Use an approved YouTube, Instagram or Pexels video URL.');
    return {id:slug(video.id),title:text(video.title,100),category:text(video.category,40),embedUrl};
  });
  const testimonials = v.testimonials.map((testimonial: Testimonial) => {
    if (!testimonial || typeof testimonial !== 'object') throw new ValidationError('Invalid testimonial.');
    if(typeof testimonial.preview!=='boolean') throw new ValidationError('Set whether a testimonial is preview content.');
    const media=mediaReference(testimonial);
    return {id:slug(testimonial.id),quote:text(testimonial.quote,500),name:text(testimonial.name,100),occasion:text(testimonial.occasion,100,false),preview:testimonial.preview,...media};
  });
  for (const list of [services, courses, gallery, videos, testimonials]) if (new Set(list.map(i => i.id)).size !== list.length) throw new ValidationError('IDs must be unique.');
  const offer = v.offer as Content['offer'];
  if (!offer || typeof offer.enabled !== 'boolean') throw new ValidationError('Invalid offer.');
  if (offer.enabled && !validDate(offer.endsAt)) throw new ValidationError('Active offers need a valid expiry date.');
  const phone = text(v.phone, 20, false);
  if (phone && !/^\+?[\d\s-]{10,20}$/.test(phone)) throw new ValidationError('Invalid phone.');
  const email = text(v.email, 150, false);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Invalid email.');
  const home=v.home as HomeContent;
  if(!home||typeof home!=='object') throw new ValidationError('Homepage content is required.');
  const homeMedia=mediaReference(home);
  return { brand: text(v.brand, 100), tagline: text(v.tagline, 150), phone, email, address: text(v.address, 250), openingHours: text(v.openingHours, 100), home:{eyebrow:text(home.eyebrow,100),title:text(home.title,100),accent:text(home.accent,100),description:text(home.description,500),...homeMedia}, services, courses, gallery, videos, testimonials, offer: { title: text(offer.title, 100, false), description: text(offer.description, 300, false), enabled: offer.enabled, endsAt: text(offer.endsAt, 10, false) } };
}
function slug(v: unknown) { const s = text(v, 70); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) throw new ValidationError('Use lowercase words separated by hyphens for IDs.'); return s; }
function mediaReference(value: { mediaId?: unknown; imageUrl?: unknown }, required = false) {
  const mediaId=typeof value.mediaId==='string'&&value.mediaId.trim()?text(value.mediaId,80):undefined;
  const imageUrl=typeof value.imageUrl==='string'&&value.imageUrl.trim()?text(value.imageUrl,200):undefined;
  if (required&&!mediaId&&!imageUrl) throw new ValidationError('Each portfolio item needs an image.');
  if (imageUrl&&!/^\/(images|media)\/[a-z0-9-]+\.(webp|png|jpe?g)$/.test(imageUrl)) throw new ValidationError('Preview images must be local image files.');
  return {mediaId,imageUrl};
}
function isApprovedEmbed(value:string) { try { const url=new URL(value); return url.protocol==='https:' && ((url.hostname==='www.youtube.com'&&url.pathname.startsWith('/embed/'))||url.hostname==='www.youtube-nocookie.com'&&url.pathname.startsWith('/embed/')||(url.hostname==='www.instagram.com'&&/^\/reel\/[\w-]+\/embed\/$/.test(url.pathname))||(url.hostname==='www.pexels.com'&&url.pathname.startsWith('/video/'))||(url.hostname==='videos.pexels.com'&&/^\/video-files\/\d+\/[^/]+\.mp4$/.test(url.pathname))); } catch { return false; } }
function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function offerActive(offer: Content['offer'], now: Date): boolean {
  return offer.enabled && validDate(offer.endsAt) && now.getTime() <= Date.parse(offer.endsAt + 'T23:59:59.999+05:30');
}
