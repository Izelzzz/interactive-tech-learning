// Fast checks that need no browser: every inline script parses, and every
// local link points at a file that exists. Runs on the built site (npm run build).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { Script } from 'node:vm';

const root = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(root)) { console.error('dist/ is missing: run npm run build first'); process.exit(1); }
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) pages.push(p);
  }
})(root);

let failures = 0;
// Same rules as Workers static assets: /path, /path/ and /path.html all serve the page.
function resolves(page, href) {
  const file = href.startsWith('/') ? join(root, href) : join(dirname(page), href);
  return [file, file + '.html', join(file, 'index.html')].some((f) => existsSync(f) && statSync(f).isFile());
}
const fail = (page, msg) => { failures++; console.error(`✗ ${relative(root, page)}: ${msg}`); };

for (const page of pages.sort()) {
  const html = readFileSync(page, 'utf8');

  for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    try { new Script(code, { filename: page }); }
    catch (e) { fail(page, `script does not parse: ${e.message}`); }
  }

  for (const [, href] of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)) {
    if (/^[a-z]+:/i.test(href)) continue;   // https:, mailto: …
    if (!resolves(page, href)) fail(page, `broken link ${href}`);
  }

  if (!/<title>[^<]+<\/title>/.test(html)) fail(page, 'missing <title>');
}

console.log(`${pages.length} pages checked, ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
