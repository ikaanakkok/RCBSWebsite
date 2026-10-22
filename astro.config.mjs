import { defineConfig } from 'astro/config';

export default defineConfig({
  // Replace this with the real domain before publishing.
  site: 'https://rcbusinesssociety.com',
  redirects: { '/': '/tr' },
  devToolbar: { enabled: false },
});
