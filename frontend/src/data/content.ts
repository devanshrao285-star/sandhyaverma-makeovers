import seed from './seed.json';
import type { Content } from '../../../backend/src/modules/content/model';
const snapshots = import.meta.glob('./published.json', { eager: true, import: 'default' });
const snapshot = Object.values(snapshots)[0] as { content: Content; revision: string } | undefined;
export const content: Content = snapshot?.content || seed;
export const revision = snapshot?.revision || 'preview';
export const launchReady = import.meta.env.PUBLIC_LAUNCH_READY === 'true';
export const priceLabel = (paise: number | null) => paise === null ? 'Request a quote' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
