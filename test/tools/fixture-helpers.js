const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const MANIFEST_PATH = path.resolve(__dirname, '..', 'fixtures', 'fixture_manifest.json');

function hashBody(body) {
  try {
    const h = crypto.createHash('sha1');
    if (Buffer.isBuffer(body)) {
      h.update(body);
    } else if (typeof body === 'string') {
      h.update(body);
    } else if (body && typeof body === 'object') {
      h.update(JSON.stringify(body));
    } else if (body != null) {
      h.update(String(body));
    }
    return h.digest('hex').slice(0, 12);
  } catch {
    return 'nohash';
  }
}

function keyFor(method, url, body) {
  const upper = String(method || 'GET').toUpperCase();
  const parsed = new URL(url);
  const sensitiveParams = ['apikey', 'api_key', 'api-key', 'key', 'token'];
  sensitiveParams.forEach((param) => parsed.searchParams.delete(param));
  const cleanUrl = `${parsed.origin}${parsed.pathname}${parsed.search}`;
  // Encode, then replace Windows-forbidden filename characters with _
  const safe = encodeURIComponent(cleanUrl).replace(/[<>:"/\\|?*]/g, '_');
  if (upper === 'GET') {
    return `${upper}_${safe}.json`;
  }
  const hash = hashBody(body);
  return `${upper}_${safe}_${hash}.json`;
}

function registerTestInManifest(testFile) {
  try {
    if (process.env.API_MODE !== 'record') return;
    let list = [];
    try {
      list = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (!Array.isArray(list)) list = [];
    } catch {}
    if (!list.includes(testFile)) {
      list.push(testFile);
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(list, null, 2));
    }
  } catch {}
}

function isInManifest(id) {
  try {
    if (!id) return false;
    if (!fs.existsSync(MANIFEST_PATH)) return false;
    const list = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    return Array.isArray(list) && list.includes(id);
  } catch {
    return false;
  }
}

module.exports = { hashBody, keyFor, registerTestInManifest, isInManifest };
