import { mkdir, writeFile, rename, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = process.cwd();
const source = process.env.CONTENT_API_URL;
const token = process.env.BUILD_TOKEN;
if (!source && !token) {
  console.log('No publication source configured; building the repository preview content.');
  process.exit(0);
}
if (!source || !token) throw new Error('Both CONTENT_API_URL and BUILD_TOKEN are required.');
const endpoint = new URL(source);
if (endpoint.protocol !== 'https:') throw new Error('Publication source must use HTTPS.');
async function fetchSource(url, maxBytes) {
  if (url.origin !== endpoint.origin) throw new Error('Cross-origin media source rejected.');
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Publication source returned ' + response.status);
  const chunks = []; let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('Publication asset exceeds its size limit.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
const snapshot = JSON.parse((await fetchSource(endpoint, 100000)).toString());
if (!/^[a-f0-9-]{36}$/.test(snapshot.revision) || !Array.isArray(snapshot.content?.gallery) || snapshot.content.gallery.length > 100) throw new Error('Invalid publication snapshot.');
const mediaDir = path.join(root, 'frontend/public/media');
await mkdir(mediaDir, { recursive: true });
const ids = [...new Set([
  ...snapshot.content.gallery.map(item => item.mediaId),
  ...snapshot.content.services.map(item => item.mediaId),
  ...snapshot.content.testimonials.map(item => item.mediaId)
].filter(Boolean))];
for (const id of ids) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid media ID.');
  const bytes = await fetchSource(new URL('/api/build/media/' + id, endpoint), 2000000);
  const destination = path.join(mediaDir, id + '.webp');
  // Resize and strip metadata at build time; no per-visitor processing or R2 reads.
  await sharp(bytes, { limitInputPixels: 25000000 }).rotate().resize({ width: 1200, height: 1500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(destination + '.tmp');
  await rename(destination + '.tmp', destination);
}
const target = path.join(root, 'frontend/src/data/published.json');
await writeFile(target + '.tmp', JSON.stringify(snapshot, null, 2));
await rename(target + '.tmp', target);
console.log('Prepared publication ' + snapshot.revision + ' with ' + ids.length + ' images.');
