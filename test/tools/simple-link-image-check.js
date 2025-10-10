#!/usr/bin/env node
/*
 Simple link & image checker (no external deps)
 - Scans Pug views under views/ai and views/api for href and img src attributes
 - Scans README.md and PROD_CHECKLIST.md for http(s) links
 - Only checks images used in button areas for ai/index and api/index (heuristic: img tags in those files)
 - Performs HEAD, falls back to GET if needed
 - Bounded concurrency
 - Prints a readable report of where each URL was found and status
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const VIEWS_DIR = path.join(ROOT, 'views');
const TARGET_VIEW_DIRS = ['ai', 'api', '', 'accounts', 'partials'];
const MARKDOWN_FILES = ['README.md', 'PROD_CHECKLIST.md'];
// any substring here (case-insensitive) will cause the URL to be skipped
// skip facebook.com as their anti-bot tends to kick in and blocks requests with 403
const SKIP_KEYWORDS = ['localhost', 'example.com', 'ngrok', 'hackathon-starter', 'facebook.com'];
// use a curl-like UA by default (simpler and matches what `curl <url>` sends locally)
// Some sites treat browser-like UAs differently; you can override this if needed.
const DEFAULT_USER_AGENT = 'curl/7.85.0';
const TIMEOUT = 10000;
// phrases that indicate an anti-bot / security block page (treat 403 as skipped when present)
const BLOCKED_PHRASES = ['this website is using a security service to protect itself from online attacks.', 'enable javascript and cookies to continue'];

function extractUrlsFromHtmlLike(text) {
  if (!text) return [];
  // capture href= and src= attributes in a single pass
  const attrRe = /(?:href|src)=(?:"|')([^"']+)(?:"|')/gi;
  const urls = new Set();
  let m;
  while ((m = attrRe.exec(text)) !== null) {
    const u = m[1];
    if (u && /^https?:\/\//i.test(u)) urls.add(u);
  }
  return Array.from(urls);
}

function extractUrlsFromMarkdown(md) {
  if (!md) return [];
  const urls = new Set();
  // capture standard markdown links [text](https://...) and also bare URLs
  const mdLink = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  const bare = /(?<!\()https?:\/\/[\w\-._~:\/\?#\[\]@!$&'()*+,;=%]+/g;
  let m;
  while ((m = mdLink.exec(md)) !== null) urls.add(normalizeUrl(m[1]));
  while ((m = bare.exec(md)) !== null) urls.add(normalizeUrl(m[0]));
  return Array.from(urls);
}

function normalizeUrl(u) {
  if (!u) return u;
  // strip trailing punctuation that sometimes appears in markdown ('), , ., ])
  u = u.trim();
  u = u.replace(/\)$/, '');
  u = u.replace(/\]$/, '');
  u = u.replace(/[\.,;:]$/, '');
  const dup = /^(https?:\/\/[^\s]+)\]\(https?:\/\/[^\s]+\)$/;
  const m = dup.exec(u);
  if (m) return m[1];
  return u;
}
// minimal in-place retry: 1 retry with a short linear backoff (no duplicated fetch logic)
const RETRIES = 2; // total attempts
const BACKOFF_MS = 10000;

async function checkUrl(initialUrl, timeout = TIMEOUT) {
  let lastErr = null;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const res = await fetch(initialUrl, {
        method: 'GET',
        headers: { 'User-Agent': DEFAULT_USER_AGENT, Accept: '*/*' },
        signal: AbortSignal.timeout(timeout),
      });

      const { status } = res;
      const headers = Object.fromEntries(res.headers);

      if (status === 403) {
        // read up to 8192 bytes from the body
        const bufs = [];
        let total = 0;
        for await (const chunk of res.body) {
          const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bufs.push(buf);
          total += buf.length;
          if (total >= 8192) break;
        }
        const snippet = Buffer.concat(bufs, Math.min(total, 8192)).toString('utf8', 0, 8192);
        return { url: initialUrl, ok: false, status, headers, bodySnippet: snippet };
      }

      return { url: initialUrl, ok: status < 400, status, headers };
    } catch (err) {
      console.log(`Attempted to fetch: ${initialUrl}\n ${err}`);
      lastErr = err;
      if (attempt >= RETRIES) {
        return { url: initialUrl, ok: false, error: (err && (err.message || err.stack)) || String(err) };
      }
      // small linear backoff before retrying
      console.log(`Retrying ${initialUrl} in ${BACKOFF_MS}ms...`);
      await new Promise((r) => setTimeout(r, BACKOFF_MS));
    }
  }
  return { url: initialUrl, ok: false, error: lastErr };
}

// Scan views (Pug/HTML/Jade) under the target view directories and return
// an array of { url, source } entries.
function scanViews() {
  const items = [];
  for (const d of TARGET_VIEW_DIRS) {
    const dir = path.join(VIEWS_DIR, d);
    let files = [];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith('.pug') || f.endsWith('.html') || f.endsWith('.jade'));
    } catch {
      continue;
    }
    for (const f of files) {
      const p = path.join(dir, f);
      const txt = fs.readFileSync(p, 'utf8');
      const urls = extractUrlsFromHtmlLike(txt);
      for (const u of urls) {
        if (f.endsWith('.pug') && typeof u === 'string') {
          const needle = `${u}' +`;
          if (txt.includes(needle)) continue;
        }
        items.push({ url: u, source: `views/${d}/${f}` });
      }
    }
  }

  // only check images on ai/index and api/index
  for (const d of TARGET_VIEW_DIRS) {
    const p = path.join(VIEWS_DIR, d, 'index.pug');
    let txt;
    try {
      txt = fs.readFileSync(p, 'utf8');
    } catch {
      continue;
    }
    const srcRe = /img[^>]*src=(?:"|')([^"']+)(?:"|')/gi;
    let m;
    while ((m = srcRe.exec(txt)) !== null) {
      const u = m[1];
      if (u && /^https?:\/\//i.test(u) && /\.(jpe?g|png|gif|svg|webp)(?:\?|$)/i.test(u)) {
        items.push({ url: u, source: `views/${d}/index.pug (img)` });
      }
    }
  }

  return items;
}

// Scan markdown files listed in MARKDOWN_FILES and return an array of { url, source }
function scanMarkdown() {
  const items = [];
  for (const md of MARKDOWN_FILES) {
    const p = path.join(ROOT, md);
    let txt;
    try {
      txt = fs.readFileSync(p, 'utf8');
    } catch {
      continue;
    }
    const urls = extractUrlsFromMarkdown(txt);
    for (const u of urls) items.push({ url: u, source: md });
  }
  return items;
}

// Dedupe a single list of {url, source} into [{url, sources: []}]
function dedupeList(list) {
  const map = new Map();
  for (const it of list) {
    if (!map.has(it.url)) map.set(it.url, { url: it.url, sources: new Set() });
    map.get(it.url).sources.add(it.source);
  }
  return Array.from(map.values()).map((v) => ({ url: v.url, sources: [...v.sources] }));
}

// Check an array of deduped {url, sources} entries and return { results, processed, total }
async function checkList(deduped) {
  const results = [];
  let processed = 0;
  const total = deduped.length;
  for (const u of deduped) {
    await new Promise((res) => setTimeout(res, 30));
    const r = await checkUrl(u.url);
    const merged = { ...u, ...r };
    processed += 1;
    if (merged.status === 403) {
      const body = (merged.bodySnippet || '').toLowerCase();
      if (BLOCKED_PHRASES.some((ph) => body.includes(ph))) merged._skipped403 = true;
    }
    if (!merged.ok && !(merged.status === 403 && merged._skipped403)) results.push(merged);
    if (merged.status >= 300 && !merged._skipped403) {
      console.log(`\x1b[33mBAD LINK\x1b[0m: ${merged.url} => ${merged.status || merged.error}  (found in: ${merged.sources.join(', ')})`);
    }
    if (processed % 50 === 0 || processed === total) console.log(`Progress: ${processed}/${total}`);
  }
  return { results, processed, total };
}

async function run() {
  console.log('--- Checking views (views/ai + views/api) ---');
  const viewsItems = dedupeList(scanViews());
  const viewsFiltered = viewsItems.filter((u) => {
    const lower = String(u.url || '').toLowerCase();
    return !SKIP_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  });
  const viewsRes = await checkList(viewsFiltered);
  console.log(`Views: checked ${viewsRes.processed} unique URLs — Broken: ${viewsRes.results.length}`);

  console.log('\n--- Checking markdown files ---');
  const mdItems = dedupeList(scanMarkdown());
  const mdFiltered = mdItems.filter((u) => {
    const lower = String(u.url || '').toLowerCase();
    return !SKIP_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  });
  const mdRes = await checkList(mdFiltered);
  console.log(`Markdown: checked ${mdRes.processed} unique URLs — Broken: ${mdRes.results.length}`);

  const allBroken = [...viewsRes.results, ...mdRes.results];
  if (allBroken.length === 0) {
    console.log('\nAll good.');
    return;
  }
  console.log('\nBroken resources:');
  for (const b of allBroken.sort((a, z) => a.url.localeCompare(z.url))) {
    console.log(`- ${b.url}`);
    console.log(`    found in: ${b.sources.join(', ')}`);
    console.log(`    reason: ${b.error || b.status}`);
  }
  process.exitCode = 2;
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(3);
  });
}

// Helpers for external callers (tests) — return filtered, deduped lists ready for checkList
function getViewsChecks() {
  return dedupeList(scanViews()).filter((u) => {
    const lower = String(u.url || '').toLowerCase();
    return !SKIP_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  });
}

function getMarkdownChecks() {
  return dedupeList(scanMarkdown()).filter((u) => {
    const lower = String(u.url || '').toLowerCase();
    return !SKIP_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
  });
}

module.exports = {
  scanViews,
  scanMarkdown,
  dedupeList,
  checkList,
  getViewsChecks,
  getMarkdownChecks,
  checkUrl,
};
