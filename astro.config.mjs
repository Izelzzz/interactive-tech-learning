import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// The hand-written lessons in demos/ are copied into the build untouched;
// new pages are MDX files under src/pages that reuse the components in src/components.
export default defineConfig({
  publicDir: './demos',
  outDir: './dist',
  integrations: [mdx()],
  build: { format: 'directory', inlineStylesheets: 'always' },
});
