const crypto = require('node:crypto');
const { providerRevocationConfig } = require('./passport');

function generateOAuth1Header(method, url, consumerKey, consumerSecret, token, tokenSecret) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: token,
    oauth_version: '1.0',
  };
  const paramStr = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  const baseStr = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64');
  params.oauth_signature = signature;
  return `OAuth ${Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`)
    .join(', ')}`;
}

async function revokeToken(revokeURL, token, tokenTypeHint, config, tokenSecret) {
  try {
    const headers = {};
    let body;
    let method = 'POST';
    let finalURL = revokeURL;
    switch (config.authMethod) {
      case 'basic': {
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        headers.Authorization = `Basic ${credentials}`;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams({ token, token_type_hint: tokenTypeHint });
        break;
      }
      case 'body': {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams({ token, token_type_hint: tokenTypeHint, client_id: config.clientId, client_secret: config.clientSecret });
        break;
      }
      case 'token_only': {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams({ token });
        break;
      }
      case 'client_id_only': {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = new URLSearchParams({ token, client_id: config.clientId });
        break;
      }
      case 'json_body': {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ token, client_id: config.clientId, client_secret: config.clientSecret });
        break;
      }
      case 'trakt': {
        headers['Content-Type'] = 'application/json';
        headers['trakt-api-key'] = config.clientId;
        headers['trakt-api-version'] = '2';
        body = JSON.stringify({ token, client_id: config.clientId, client_secret: config.clientSecret });
        break;
      }
      case 'facebook': {
        method = 'DELETE';
        finalURL = `${revokeURL}?access_token=${encodeURIComponent(token)}`;
        break;
      }
      case 'github': {
        method = 'DELETE';
        const creds = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        headers.Authorization = `Basic ${creds}`;
        headers.Accept = 'application/vnd.github+json';
        headers['X-GitHub-Api-Version'] = '2022-11-28';
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ access_token: token });
        break;
      }
      case 'oauth1': {
        headers.Authorization = generateOAuth1Header('POST', revokeURL, config.consumerKey, config.consumerSecret, token, tokenSecret);
        break;
      }
      default:
        console.warn(`Token revocation: unknown authMethod '${config.authMethod}'`);
        return false;
    }
    const response = await fetch(finalURL, { method, headers, body });
    if (response.ok) return true;
    console.warn(`Token revocation: ${revokeURL} responded with HTTP ${response.status}`);
    return false;
  } catch (err) {
    console.warn(`Token revocation: request to ${revokeURL} failed — ${err.message}`);
    return false;
  }
}

async function revokeProviderTokens(providerName, tokenData) {
  const config = providerRevocationConfig[providerName];
  if (!config || !tokenData) return;
  const tasks = [];
  if (tokenData.refreshToken) {
    tasks.push(revokeToken(config.revokeURL, tokenData.refreshToken, 'refresh_token', config, tokenData.tokenSecret));
  }
  if (tokenData.accessToken) {
    tasks.push(revokeToken(config.revokeURL, tokenData.accessToken, 'access_token', config, tokenData.tokenSecret));
  }
  await Promise.allSettled(tasks);
}

async function revokeAllProviderTokens(tokens) {
  if (!tokens || tokens.length === 0) return;
  const tasks = tokens.filter((t) => providerRevocationConfig[t.kind]).map((t) => revokeProviderTokens(t.kind, t));
  await Promise.allSettled(tasks);
}

module.exports = { revokeProviderTokens, revokeAllProviderTokens };
