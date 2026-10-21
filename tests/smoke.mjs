// Browser smoke tests: every lesson page loads in both levels at desktop and
// phone width without errors or horizontal scrolling, plus regression checks
// for bugs found in review.
//
// Set CHROMIUM_PATH to use an existing Chromium instead of Playwright's own.
import { chromium } from 'playwright';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../demos/', import.meta.url).pathname;
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) pages.push(p);
  }
})(root);
pages.sort();

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failures = 0;
const fail = (name, msg) => { failures++; console.error(`✗ ${name}: ${msg}`); };
const ok = (name) => console.log(`✓ ${name}`);
const url = (rel) => pathToFileURL(join(root, rel)).href;

async function open(rel, viewport = { width: 1200, height: 900 }, colorScheme = 'light') {
  const page = await browser.newPage({ viewport, colorScheme });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url(rel));
  return { page, errors };
}

async function setLevel(page, level) {
  if (await page.locator('.seg button').count()) await page.click(`.seg button[data-level="${level}"]`);
}

// ---------------------------------------------------------------- every page
for (const file of pages) {
  const rel = relative(root, file);
  for (const [viewport, scheme] of [[{ width: 1200, height: 900 }, 'light'], [{ width: 390, height: 844 }, 'dark']]) {
    const { page, errors } = await open(rel, viewport, scheme);
    for (const level of ['advanced', 'beginner']) {
      await setLevel(page, level);
      await page.waitForTimeout(150);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      if (width > viewport.width) fail(`${rel} @${viewport.width} ${level}`, `page scrolls sideways (${width}px)`);
    }
    if (errors.length) fail(`${rel} @${viewport.width}`, errors.join(' | '));
    await page.close();
  }
}
ok(`${pages.length} pages load cleanly at 1200px and 390px in both levels`);

// ---------------------------------------------------------------- regressions
async function check(name, fn) {
  try { await fn(); ok(name); } catch (e) { fail(name, e.message); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

await check('SQL injection: textbook payloads behave like real SQL', async () => {
  const { page } = await open('sql/index.html');
  await setLevel(page, 'advanced');
  const run = async (input) => {
    await page.fill('#injInput', input);
    return {
      rows: await page.locator('#injRes tbody tr').count(),
      dropped: (await page.textContent('#injRes')).includes('table dropped'),
      msg: await page.textContent('#injInsight'),
    };
  };
  const all = (await run("' OR '1'='1")).rows;
  assert(all > 1, `' OR '1'='1 should return every customer, got ${all}`);
  assert((await run("' OR ''='")).rows === all, "' OR ''=' should also return every customer");
  const dropName = await run('Drop table');
  assert(!dropName.dropped, 'a plain name containing "drop table" must not drop the table');
  assert((await run("'; DROP TABLE customers; --")).dropped, 'the DROP TABLE payload should drop the table');
  assert(/comment/i.test((await run("Ana'--")).msg), "Ana'-- should be explained as a comment injection");
  await page.close();
});

await check('SQL NULL explainer: two worlds and the WHERE doorman agree with the data', async () => {
  const { page } = await open('sql/index.html');
  await setLevel(page, 'advanced');
  await page.click('#worldPick button:has-text("TRUE OR NULL")');
  assert(/agree/.test(await page.textContent('#worldVerdict')), 'TRUE OR NULL should be settled in both worlds');
  await page.click('#worldPick button:has-text("3 NOT IN")');
  assert(/UNKNOWN/.test(await page.textContent('#worldVerdict')), 'NOT IN with NULL should be UNKNOWN');
  const count = async () => ({ in: await page.locator('#gateRows .gate-row.in').count(), stuck: await page.locator('#gateRows .gate-row.stuck').count() });
  let c = await count();
  assert(c.in === 5 && c.stuck === 1, `city <> 'Paris' should let 5 in and stop Eli, got ${JSON.stringify(c)}`);
  await page.click('#gatePick button:has-text("IS NULL")');
  c = await count();
  assert(c.in === 6 && c.stuck === 0, `adding OR city IS NULL should let Eli in, got ${JSON.stringify(c)}`);
  await page.close();
});

await check('SQL JOIN: FULL JOIN + WHERE is described as a RIGHT JOIN', async () => {
  const { page } = await open('sql/index.html');
  await setLevel(page, 'advanced');
  await page.click('#joinType button:has-text("FULL OUTER JOIN")');
  await page.click('#joinFilter button:has-text("WHERE o.amount > 50")');
  // the insight updates after the rows that fail the filter have faded out
  await page.waitForFunction(() => document.querySelector('#joinInsight').textContent.includes('WHERE o.amount'), null, { timeout: 8000 });
  const text = await page.textContent('#joinInsight');
  assert(/RIGHT JOIN/.test(text) && !/turned into an INNER JOIN/.test(text), `unexpected insight: ${text.slice(0, 120)}`);
  await page.close();
});

await check('API pagination: delete before loading a page removes nothing', async () => {
  const { page } = await open('api-design/index.html');
  const before = await page.locator('#strip .schip').count();
  await page.click('#pgDel');
  await page.waitForTimeout(600);
  assert(await page.locator('#strip .schip').count() === before, 'a post was deleted although none had been seen');
  await page.close();
});

await check('Database index race: switching the name cancels the running race', async () => {
  const { page } = await open('database-design/index.html');
  await page.selectOption('#whoSel', 'zoe');
  await page.click('#raceBtn');
  await page.waitForTimeout(300);
  await page.selectOption('#whoSel', 'ben');
  await page.waitForTimeout(4000);
  const row = await page.textContent('#tn-rowtext');
  assert(!row.includes('zoe'), `stale race kept running: ${row}`);
  await page.close();
});

await check('HTTP (Chinese): packet labels fit inside their pills', async () => {
  const { page } = await open('http-basics/index.zh-CN.html');
  await page.locator('#timeline button').nth(3).click();   // TLS stage, long Chinese labels
  await page.waitForSelector('#packets g text');
  const [rectW, textW] = await page.evaluate(() => {
    const g = document.querySelector('#packets g');
    return [Number(g.querySelector('rect').getAttribute('width')), g.querySelector('text').getComputedTextLength()];
  });
  assert(rectW >= textW, `label ${textW.toFixed(0)}px is wider than its pill ${rectW}px`);
  await page.close();
});

await check('HTTP play: a quick pause and play runs only one loop', async () => {
  const { page } = await open('http-basics/index.html');
  await page.click('#playBtn');                       // play from stage 1
  await page.waitForFunction(() => document.querySelector('#timeline .visited'));
  await page.click('#playBtn');                       // pause during the gap after stage 1
  await page.click('#playBtn');                       // play again: restarts stage 1
  await page.waitForTimeout(1500);                    // the old loop would wake up here and jump ahead
  const current = await page.evaluate(() => [...document.querySelectorAll('#timeline button')].findIndex(b => b.classList.contains('current')));
  assert(current === 0, `stage jumped to ${current + 1}; an old play loop is still running`);
  await page.close();
});

await browser.close();
console.log(failures ? `${failures} failure(s)` : 'all smoke tests passed');
process.exit(failures ? 1 : 0);
