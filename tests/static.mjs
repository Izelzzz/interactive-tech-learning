// Fast checks that need no browser: every inline script parses, and every
// relative link points at a file that exists.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { Script } from 'node:vm';

const root = new URL('../demos/', import.meta.url).pathname;
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) pages.push(p);
  }
})(root);

let failures = 0;
const fail = (page, msg) => { failures++; console.error(`✗ ${relative(root, page)}: ${msg}`); };

for (const page of pages.sort()) {
  const html = readFileSync(page, 'utf8');

  for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    try { new Script(code, { filename: page }); }
    catch (e) { fail(page, `script does not parse: ${e.message}`); }
  }

  for (const [, href] of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)) {
    if (/^[a-z]+:/i.test(href)) continue;   // https:, mailto: …
    if (!existsSync(join(dirname(page), href))) fail(page, `broken link ${href}`);
  }

  if (!/<title>[^<]+<\/title>/.test(html)) fail(page, 'missing <title>');
}

console.log(`${pages.length} pages checked, ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
