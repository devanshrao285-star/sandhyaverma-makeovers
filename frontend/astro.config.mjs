import { defineConfig } from 'astro/config';
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://sandhyavermamakeovers.online',
  output: 'static',
  trailingSlash: 'always',
  server: { port: 4321 },
});
