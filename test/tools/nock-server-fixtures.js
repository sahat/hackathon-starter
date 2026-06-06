/**
 * Server-side nock record/replay fixture system.
 *
 * Three modes:
 *  - 'record': real HTTP flows through; each captured request is written
 *              to test/fixtures/<sanitized-url>.json. API keys are redacted.
 *  - 'replay': lockdown mode; every JSON file under test/fixtures/ is
 *              loaded as a persistent nock interceptor.
 *  - undefined: no-op. Controllers hit real APIs.
 *
 * We do our own setup (instead of nock.back) because nock lives in the
 * long-lived webserver process, not the per-test process, and we need
 * the interceptors to persist across the entire Playwright run.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const nock = require('nock').default;
const { scrub } = require('@zapier/secret-scrubber');

const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');
if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR);
nock.back.fixtures = FIXTURES_DIR;

const ENV_EXAMPLE = path.resolve(__dirname, '..', '..', '.env.example');

const SENSITIVE_FIELDS = new Set([
  // Cross-provider sensitive identifiers.
  'api_key',
  'apikey',
  'api-key',
  'auth',
  'authorization',
  'client_id',
  'client_secret',
  'jwt',
  'passwd',
  'password',
  'pswd',
  'secret',
  'signature',
  'token',
  'access_token',
  'refresh_token',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-auth',
  'cookie',
  'proxy-authorization',

  // Twilio — account identifier and resource SIDs.
  'account_sid',
  'messaging_service_sid',
  'sid',

  // fields that get added to URL which can make them unique
  'expires',
  'signiture',
]);

// Add the name of any env var that you use which isn't in .env.example
// so they get redacted from the recorded fixtures.
// Anything in .env.example that is not in the ignore lists below will
// automatically get included as well.
const INCLUDE_ENV_VAR = ['discordBotToken'];

// Add name of env variables that are in .env.example that would never contain a secret value
const IGNORE_ENV_EXAMPLE_KEYS = ['BASE_URL', 'SITE_CONTACT_EMAIL', 'TRANSACTION_EMAIL', 'TWILIO_FROM_NUMBER', 'GROQ_MODEL', 'GROQ_VISION', 'GROQ_MODEL_PROMPT_GUARD', 'HUGGINGFACE_EMBEDDING_MODEL', 'HUGGINGFACE_PROVIDER'];

// Add strings that are placeholders in .env.example or not a secret
// You don't need to include strings that are in IGNORE_ENV_EXAMPLE_KEYS
const IGNORE_ENV_EXAMPLE_VALUES = [
  'http://localhost:8080',
  'mongodb://localhost:27017/test',
  'youremail@yourdomain.com',
  'youremail-OR-noreply@yourdomain.com',
  'your-smtp-username',
  'your-smtp-password',
  'discord-client-id/discord-app-id',
  'hackathon-starter-xxxxxx',
  '828110519058.apps.googleusercontent.com',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-guard-4-12b',
  'BAAI/bge-small-en-v1.5',
  'hf-inference',
  'hackathon-starter',
];

// Build the secret-values registry used by the Zapier scrubber in
// saveRecordedRequest. The list is the values of (env-var names
// declared in .env.example, minus the IGNORE lists) plus any names
// in INCLUDE_ENV_VAR. We populate process.env from .env.example
// first (existing values are preserved) so that we read whatever
// the live process has, not the placeholder.
function buildSecretValues() {
  try {
    process.loadEnvFile(ENV_EXAMPLE);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error(`[nock] error loading ${ENV_EXAMPLE}:`, err);
    }
  }
  const text = fs.readFileSync(ENV_EXAMPLE, 'utf8');
  const parsed = Object.fromEntries(
    text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
  const values = [];
  for (const [key, placeholder] of Object.entries(parsed)) {
    const inLookup = !IGNORE_ENV_EXAMPLE_KEYS.includes(key) || INCLUDE_ENV_VAR.includes(key);
    if (!inLookup || IGNORE_ENV_EXAMPLE_VALUES.includes(placeholder)) continue;
    if (process.env[key]) values.push(process.env[key]);
  }
  for (const key of INCLUDE_ENV_VAR) {
    if (key in parsed || IGNORE_ENV_EXAMPLE_KEYS.includes(key)) continue;
    if (process.env[key]) values.push(process.env[key]);
  }
  return values;
}

function redactByField(value) {
  // Array of pairs (Node http.IncomingMessage.rawHeaders: [name, value, name, value, ...]).
  // Detected by even length and a string at the first even index.
  if (Array.isArray(value) && value.length >= 2 && value.length % 2 === 0 && typeof value[0] === 'string') {
    const out = new Array(value.length);
    for (let i = 0; i < value.length; i += 2) {
      out[i] = value[i];
      const k = typeof value[i] === 'string' ? value[i].toLowerCase() : null;
      out[i + 1] = k != null && SENSITIVE_FIELDS.has(k) ? 'REDACTED' : redactByField(value[i + 1]);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(redactByField);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_FIELDS.has(String(k).toLowerCase()) ? 'REDACTED' : redactByField(v);
    }
    return out;
  }
  return value;
}

// Hash a path in a way that's stable across environments that have
// different real values for the same secret field. For each known
// secret value in `secretValues`, every occurrence in the path is
// replaced with REDACTED; the result is SHA-256 hashed and the first
// 12 hex chars become the placeholder. The same replacement is
// applied to LIVE paths via `filteringPath` at load time, so a
// recording made with `apikey=REAL_KEY` hashes the same as a replay
// with `apikey=PLACEHOLDER`. Query parameters in the path string
// are not parsed; this is a plain string-replace-and-hash, not a
// URL-aware transform.
function rewritePathForFixture(p, secretValues) {
  const hash = crypto
    .createHash('sha256')
    .update(secretValues.reduce((s, v) => s.replaceAll(v, 'REDACTED'), p))
    .digest('hex')
    .slice(0, 12);
  return `/${hash}`;
}

function bodyFingerprint(body) {
  try {
    const h = crypto.createHash('sha256');
    if (Buffer.isBuffer(body)) h.update(body);
    else if (typeof body === 'string') h.update(body);
    else if (body && typeof body === 'object') h.update(JSON.stringify(body));
    else if (body != null) h.update(String(body));
    return h.digest('hex').slice(0, 12);
  } catch {
    return 'nohash';
  }
}

function fixtureFilename(method, url, body) {
  const upper = String(method || 'GET').toUpperCase();
  const safe = encodeURIComponent(url).replace(/[<>:"/\\|?*]/g, '_');
  if (upper === 'GET') return `${upper}_${safe}.json`;
  return `${upper}_${safe}_${bodyFingerprint(body)}.json`;
}

function saveRecordedRequest(req, secretValues) {
  if (req.path) req.path = rewritePathForFixture(req.path, secretValues);
  req = redactByField(req);
  if (secretValues.length > 0) req = scrub(req, secretValues);
  const url = `${String(req.scope || '')
    .replace(/:443$/, '')
    .replace(/:80$/, '')}${req.path || '/'}`;
  const file = path.join(FIXTURES_DIR, fixtureFilename(req.method, url, req.body));
  fs.writeFileSync(file, JSON.stringify([req], null, 2));
}

function loadFixtureScopes(rewritePath) {
  let loaded = 0;
  for (const file of fs.readdirSync(FIXTURES_DIR)) {
    if (!file.endsWith('.json')) continue;
    const defs = nock.loadDefs(path.join(FIXTURES_DIR, file));
    if (!Array.isArray(defs) || defs.length === 0) continue;
    for (const interceptor of nock.define(defs)) {
      interceptor.persist();
      // filteringPath rewrites the LIVE request path to the same
      // hash placeholder used when the fixture was recorded
      interceptor.filteringPath(rewritePath);
    }
    loaded += defs.length;
  }
  return loaded;
}

function logMissingFixtures(rewritePath) {
  const reported = new Set();
  nock.emitter.on('no match', (outgoing) => {
    // nock emits from three sites: a ClientRequest with .url, a converted
    // ClientRequest with .url, or an options object with .host+.path.
    // Build a URL that matches what fixtureFilename expects.
    let url;
    if (typeof outgoing === 'string') {
      url = outgoing;
    } else if (outgoing) {
      ({ url } = outgoing);
      if (!url && outgoing.host) url = `${outgoing.host}${outgoing.path || '/'}`;
    }
    if (!url || reported.has(url)) return;
    reported.add(url);
    const method = (outgoing && outgoing.method) || 'GET';
    // Replace the path+query with the same hash placeholder used in the fixture filename
    let scrubbedUrl = url;
    try {
      const parsed = new URL(url);
      scrubbedUrl = parsed.origin + rewritePath(parsed.pathname + parsed.search);
    } catch {
      // Fall back to the raw URL if it can't be parsed.
    }
    const filename = fixtureFilename(method, scrubbedUrl);
    console.error(`[nock] MISSING FIXTURE for ${method} ${scrubbedUrl}\n      Expected: test/fixtures/${filename}\n      Re-record: npm run test:e2e:custom -- --project=chromium-record`);
  });
}

// When a controller's catch block logs a NetConnectNotAllowedError, the
// full stack trace drowns the [nock] MISSING FIXTURE line above. Replace
// the error arg with just its message so the label + URL stay but the
// stack frames go away.
function silenceNockErrorTraces() {
  const original = console.error;
  console.error = function patched(...args) {
    const cleaned = args.map((a) => {
      if (a instanceof Error && (a.name === 'NetConnectNotAllowedError' || (a.message && a.message.startsWith('Nock: Disallowed')))) {
        return a.message;
      }
      return a;
    });
    original.apply(console, cleaned);
  };
}

async function installNockReplayFixtures({ mode } = {}) {
  if (!mode) return { mode: 'live' };
  const secretValues = buildSecretValues();
  // Bound a path rewriter that captures the current secret values so it
  // produces the same hash for the same logical URL regardless of the
  // env's secret values.
  const rewritePath = (p) => rewritePathForFixture(p, secretValues);
  nock.recorder.clear();

  if (mode === 'record') {
    nock.back.setMode('record');
    nock.enableNetConnect();
    nock.recorder.rec({
      output_objects: true,
      dont_print: false,
      use_separator: false,
      enable_reqheaders_recording: false,
      logging: (req) => saveRecordedRequest(req, secretValues),
    });
    return { mode: 'record' };
  }

  // lockdown: all unmocked external HTTP is rejected. Allow localhost so
  // the webserver can still answer the test browser.
  nock.back.setMode('lockdown');
  nock.disableNetConnect();
  nock.enableNetConnect(/^(127\.0\.0\.1|localhost)(:\d+)?$/);
  silenceNockErrorTraces();
  const loaded = loadFixtureScopes(rewritePath);
  if (loaded === 0) {
    console.warn('[nock] replay mode: no fixtures loaded from test/fixtures/.\n      To record fixtures, run: npm run test:e2e:custom -- --project=chromium-record');
  }
  logMissingFixtures(rewritePath);
  // Yield so @mswjs/interceptors finish applying their global patches
  // before the first request comes in.
  await new Promise((resolve) => setImmediate(resolve));
  return { mode: 'replay', loaded };
}

module.exports = { installNockReplayFixtures };
