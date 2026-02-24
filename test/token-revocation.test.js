const path = require('node:path');
const { expect } = require('chai');
const sinon = require('sinon');
process.loadEnvFile(path.join(__dirname, '.env.test'));
const { providerRevocationConfig } = require('../config/passport');
const { revokeProviderTokens, revokeAllProviderTokens } = require('../config/token-revocation');

// Inject a set of fake providers into providerRevocationConfig for testing.
// Tests use these exclusively so they don't break when real providers are added/removed.
const testProviders = {
  test_basic: { revokeURL: 'https://test.example.com/revoke/basic', clientId: 'cid', clientSecret: 'csec', authMethod: 'basic' },
  test_body: { revokeURL: 'https://test.example.com/revoke/body', clientId: 'cid', clientSecret: 'csec', authMethod: 'body' },
  test_token_only: { revokeURL: 'https://test.example.com/revoke/token_only', authMethod: 'token_only' },
  test_client_id_only: { revokeURL: 'https://test.example.com/revoke/client_id_only', clientId: 'cid', authMethod: 'client_id_only' },
  test_json_body: { revokeURL: 'https://test.example.com/revoke/json', clientId: 'cid', clientSecret: 'csec', authMethod: 'json_body' },
  test_trakt: { revokeURL: 'https://test.example.com/revoke/trakt', clientId: 'cid', clientSecret: 'csec', authMethod: 'trakt' },
  test_facebook: { revokeURL: 'https://test.example.com/me/permissions', authMethod: 'facebook' },
  test_github: { revokeURL: 'https://test.example.com/applications/cid/token', clientId: 'cid', clientSecret: 'csec', authMethod: 'github' },
  test_oauth1: { revokeURL: 'https://test.example.com/oauth/invalidate_token', consumerKey: 'ck', consumerSecret: 'cs', authMethod: 'oauth1' },
};

describe('Token Revocation', () => {
  let fetchStub;
  let originalFetch;

  before(() => {
    Object.assign(providerRevocationConfig, testProviders);
  });

  after(() => {
    for (const key of Object.keys(testProviders)) {
      delete providerRevocationConfig[key];
    }
  });

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchStub = sinon.stub();
    global.fetch = fetchStub;
    fetchStub.resolves({ ok: true, status: 200 });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('providerRevocationConfig structure', () => {
    it('every entry should have revokeURL and authMethod', () => {
      for (const [name, config] of Object.entries(providerRevocationConfig)) {
        expect(config, `${name} missing revokeURL`).to.have.property('revokeURL').that.is.a('string');
        expect(config, `${name} missing authMethod`).to.have.property('authMethod').that.is.a('string');
      }
    });
  });

  describe('revokeProviderTokens', () => {
    it('should be a no-op for providers not in the registry', async () => {
      await revokeProviderTokens('nonexistent_provider', { kind: 'nonexistent_provider', accessToken: 'tok' });
      expect(fetchStub.called).to.be.false;
    });

    it('should be a no-op when tokenData is null or undefined', async () => {
      await revokeProviderTokens('test_token_only', null);
      await revokeProviderTokens('test_token_only', undefined);
      expect(fetchStub.called).to.be.false;
    });

    it('should revoke only the access token when no refresh token exists', async () => {
      await revokeProviderTokens('test_token_only', { accessToken: 'access-123' });
      expect(fetchStub.calledOnce).to.be.true;
      const body = fetchStub.firstCall.args[1].body.toString();
      expect(body).to.include('token=access-123');
    });

    it('should revoke both refresh and access tokens when both exist', async () => {
      await revokeProviderTokens('test_token_only', { accessToken: 'access-1', refreshToken: 'refresh-1' });
      expect(fetchStub.calledTwice).to.be.true;
      const firstBody = fetchStub.firstCall.args[1].body.toString();
      const secondBody = fetchStub.secondCall.args[1].body.toString();
      expect(firstBody).to.include('token=refresh-1');
      expect(secondBody).to.include('token=access-1');
    });

    it('should POST to the configured revokeURL', async () => {
      await revokeProviderTokens('test_body', { accessToken: 'tok' });
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal('https://test.example.com/revoke/body');
      expect(options.method).to.equal('POST');
    });

    // --- authMethod variations ---

    it('basic: should use HTTP Basic auth header and not put credentials in body', async () => {
      await revokeProviderTokens('test_basic', { accessToken: 'tok' });
      const [, options] = fetchStub.firstCall.args;
      expect(options.headers.Authorization).to.match(/^Basic /);
      const body = options.body.toString();
      expect(body).to.include('token=tok');
      expect(body).to.include('token_type_hint=access_token');
      expect(body).to.not.include('client_id');
    });

    it('body: should include client_id, client_secret, and token_type_hint in form body', async () => {
      await revokeProviderTokens('test_body', { accessToken: 'tok' });
      const body = fetchStub.firstCall.args[1].body.toString();
      expect(body).to.include('token=tok');
      expect(body).to.include('client_id=cid');
      expect(body).to.include('client_secret=csec');
      expect(body).to.include('token_type_hint=access_token');
    });

    it('token_only: should send only the token in form body', async () => {
      await revokeProviderTokens('test_token_only', { accessToken: 'tok' });
      const body = fetchStub.firstCall.args[1].body.toString();
      expect(body).to.include('token=tok');
      expect(body).to.not.include('client_id');
      expect(body).to.not.include('client_secret');
    });

    it('client_id_only: should include client_id but not client_secret', async () => {
      await revokeProviderTokens('test_client_id_only', { accessToken: 'tok' });
      const body = fetchStub.firstCall.args[1].body.toString();
      expect(body).to.include('token=tok');
      expect(body).to.include('client_id=cid');
      expect(body).to.not.include('client_secret');
    });

    it('json_body: should send JSON with token and client credentials', async () => {
      await revokeProviderTokens('test_json_body', { accessToken: 'tok' });
      const [, options] = fetchStub.firstCall.args;
      expect(options.headers['Content-Type']).to.equal('application/json');
      const parsed = JSON.parse(options.body);
      expect(parsed.token).to.equal('tok');
      expect(parsed.client_id).to.equal('cid');
      expect(parsed.client_secret).to.equal('csec');
    });

    it('trakt: should send JSON body with trakt-api-key and trakt-api-version headers', async () => {
      await revokeProviderTokens('test_trakt', { accessToken: 'tok' });
      const [, options] = fetchStub.firstCall.args;
      expect(options.headers['Content-Type']).to.equal('application/json');
      expect(options.headers['trakt-api-key']).to.equal('cid');
      expect(options.headers['trakt-api-version']).to.equal('2');
      const parsed = JSON.parse(options.body);
      expect(parsed.token).to.equal('tok');
      expect(parsed.client_id).to.equal('cid');
      expect(parsed.client_secret).to.equal('csec');
    });

    it('facebook: should send DELETE with access_token as query param', async () => {
      await revokeProviderTokens('test_facebook', { accessToken: 'tok' });
      const [url, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal('DELETE');
      expect(url).to.include('access_token=tok');
      expect(options.body).to.be.undefined;
    });

    it('github: should send DELETE with Basic auth and JSON body containing access_token', async () => {
      await revokeProviderTokens('test_github', { accessToken: 'tok' });
      const [, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal('DELETE');
      expect(options.headers.Authorization).to.match(/^Basic /);
      expect(options.headers.Accept).to.equal('application/vnd.github+json');
      expect(options.headers['X-GitHub-Api-Version']).to.equal('2022-11-28');
      const parsed = JSON.parse(options.body);
      expect(parsed.access_token).to.equal('tok');
    });

    it('oauth1: should send POST with OAuth Authorization header', async () => {
      await revokeProviderTokens('test_oauth1', { accessToken: 'tok', tokenSecret: 'tsec' });
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal('https://test.example.com/oauth/invalidate_token');
      expect(options.method).to.equal('POST');
      expect(options.headers.Authorization).to.match(/^OAuth /);
      expect(options.headers.Authorization).to.include('oauth_consumer_key');
      expect(options.headers.Authorization).to.include('oauth_signature');
    });

    it('should not throw when server returns a non-200 status', async () => {
      fetchStub.resolves({ ok: false, status: 503 });
      await revokeProviderTokens('test_token_only', { accessToken: 'tok' });
      expect(fetchStub.calledOnce).to.be.true;
    });

    it('should not throw on network errors', async () => {
      fetchStub.rejects(new Error('ECONNREFUSED'));
      await revokeProviderTokens('test_token_only', { accessToken: 'tok' });
      expect(fetchStub.calledOnce).to.be.true;
    });

    it('should skip revocation when required config fields are missing', async () => {
      providerRevocationConfig.test_misconfigured = { revokeURL: 'https://test.example.com/revoke', authMethod: 'basic' };
      await revokeProviderTokens('test_misconfigured', { accessToken: 'tok' });
      expect(fetchStub.called).to.be.false;
      delete providerRevocationConfig.test_misconfigured;
    });

    it('should pass an AbortController signal to fetch', async () => {
      await revokeProviderTokens('test_token_only', { accessToken: 'tok' });
      const [, options] = fetchStub.firstCall.args;
      expect(options.signal).to.be.an.instanceOf(AbortSignal);
    });
  });

  describe('revokeAllProviderTokens', () => {
    it('should be a no-op when tokens is empty, null, or undefined', async () => {
      await revokeAllProviderTokens([]);
      await revokeAllProviderTokens(null);
      await revokeAllProviderTokens(undefined);
      expect(fetchStub.called).to.be.false;
    });

    it('should skip providers not in the registry', async () => {
      await revokeAllProviderTokens([{ kind: 'nonexistent', accessToken: 'tok' }]);
      expect(fetchStub.called).to.be.false;
    });

    it('should revoke tokens for multiple providers', async () => {
      const tokens = [
        { kind: 'test_token_only', accessToken: 'a' },
        { kind: 'test_body', accessToken: 'b', refreshToken: 'r' },
        { kind: 'nonexistent', accessToken: 'c' },
      ];
      await revokeAllProviderTokens(tokens);
      // test_token_only: 1 (access), test_body: 2 (refresh + access), nonexistent: 0
      expect(fetchStub.callCount).to.equal(3);
    });

    it('should continue revoking other providers if one fails', async () => {
      fetchStub.onFirstCall().rejects(new Error('network down'));
      fetchStub.onSecondCall().resolves({ ok: true, status: 200 });
      const tokens = [
        { kind: 'test_token_only', accessToken: 'a' },
        { kind: 'test_client_id_only', accessToken: 'b' },
      ];
      await revokeAllProviderTokens(tokens);
      expect(fetchStub.calledTwice).to.be.true;
    });
  });
});
