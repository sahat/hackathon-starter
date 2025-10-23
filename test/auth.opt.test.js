const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });
const { _saveOAuth2UserTokens } = require('../config/passport');
const User = require('../models/User');

describe('Microsoft OAuth Integration Tests:', () => {
  let req;
  let userStub;

  beforeEach((done) => {
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      microsoft: 'microsoft-id-123',
      tokens: [],
    });

    user.save = sinon.stub().resolves();
    user.markModified = sinon.spy();

    userStub = sinon.stub(User, 'findById').resolves(user);

    req = {
      user,
    };
    done();
  });

  afterEach((done) => {
    userStub.restore();
    done();
  });

  it('should save Microsoft OAuth tokens correctly', (done) => {
    const accessToken = 'microsoft-access-token';
    const refreshToken = 'microsoft-refresh-token';
    const accessTokenExpiration = 3600;
    const refreshTokenExpiration = 86400;
    const providerName = 'microsoft';
    const tokenConfig = { microsoft: 'microsoft-id-123' };

    _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
      .then(() => {
        expect(req.user.tokens).to.have.lengthOf(1);
        expect(req.user.tokens[0]).to.include({
          kind: 'microsoft',
          accessToken: 'microsoft-access-token',
          refreshToken: 'microsoft-refresh-token',
        });
        expect(req.user.microsoft).to.equal('microsoft-id-123');
        expect(req.user.markModified.calledWith('tokens')).to.be.true;
        expect(req.user.save.calledOnce).to.be.true;
        done();
      })
      .catch(done);
  });

  it('should handle Microsoft OAuth token refresh scenario', (done) => {
    // Setup existing expired Microsoft token
    req.user.tokens.push({
      kind: 'microsoft',
      accessToken: 'expired-microsoft-token',
      refreshToken: 'valid-microsoft-refresh-token',
      accessTokenExpires: moment().subtract(1, 'hour').format(),
    });

    const accessToken = 'new-microsoft-access-token';
    const refreshToken = 'new-microsoft-refresh-token';
    const accessTokenExpiration = 3600;
    const refreshTokenExpiration = 86400;
    const providerName = 'microsoft';

    _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
      .then(() => {
        expect(req.user.tokens).to.have.lengthOf(1);
        expect(req.user.tokens[0].accessToken).to.equal('new-microsoft-access-token');
        expect(req.user.tokens[0].refreshToken).to.equal('new-microsoft-refresh-token');
        done();
      })
      .catch(done);
  });

  it('should preserve other provider tokens when updating Microsoft tokens', (done) => {
    // Setup existing tokens for different providers
    req.user.tokens = [
      {
        kind: 'google',
        accessToken: 'google-token',
        accessTokenExpires: moment().add(1, 'hour').format(),
      },
      {
        kind: 'github',
        accessToken: 'github-token',
        accessTokenExpires: moment().add(1, 'hour').format(),
      },
    ];

    const accessToken = 'new-microsoft-token';
    const refreshToken = 'microsoft-refresh-token';
    const accessTokenExpiration = 3600;
    const refreshTokenExpiration = 86400;
    const providerName = 'microsoft';

    _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
      .then(() => {
        expect(req.user.tokens).to.have.lengthOf(3);
        expect(req.user.tokens.find((t) => t.kind === 'google').accessToken).to.equal('google-token');
        expect(req.user.tokens.find((t) => t.kind === 'github').accessToken).to.equal('github-token');
        expect(req.user.tokens.find((t) => t.kind === 'microsoft').accessToken).to.equal('new-microsoft-token');
        done();
      })
      .catch(done);
  });
});
