import seed from './seed.json';
import type { Content } from '../../../backend/src/modules/content/model';
const snapshots = import.meta.glob('./published.json', { eager: true, import: 'default' });
const snapshot = Object.values(snapshots)[0] as { content: Content; revision: string } | undefined;
export const content: Content = snapshot?.content || seed;
export const revision = snapshot?.revision || 'preview';
// Pages runs Astro builds in production mode. An explicit public flag can still
// hold a non-production build out of search, while the live production build is
// indexable without relying on runtime-only Wrangler variables.
export const launchReady = import.meta.env.PUBLIC_LAUNCH_READY
  ? import.meta.env.PUBLIC_LAUNCH_READY === 'true'
  : import.meta.env.PROD;
export const priceLabel = (paise: number | null) => paise === null ? 'Request a quote' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
