const { expect } = require('chai');
const sinon = require('sinon');
const refresh = require('passport-oauth2-refresh');
const moment = require('moment');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });
const { isAuthorized, _saveOAuth2UserTokens } = require('../config/passport');
const User = require('../models/User');

describe('Passport Config', () => {
  describe('isAuthorized Middleware', () => {
    let req;
    let res;
    let next;
    let refreshStub;

    beforeEach((done) => {
      req = {
        path: '/auth/test_provider',
        user: {
          tokens: [],
          save: sinon.stub().resolves(),
        },
      };
      res = {
        redirect: sinon.spy(),
      };
      next = sinon.spy();

      refreshStub = sinon.stub(refresh, 'requestNewAccessToken');
      done();
    });

    afterEach((done) => {
      refreshStub.restore();
      done();
    });

    it('Scenario 1: should redirect to auth provider to get new tokens when user has never authenticated with the provider', (done) => {
      isAuthorized(req, res, next)
        .then(() => {
          expect(res.redirect.calledOnce).to.be.true;
          expect(res.redirect.calledWith('/auth/test_provider')).to.be.true;
          expect(next.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 2: should proceed when access token exists and is not expired', (done) => {
      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'valid-token',
        accessTokenExpires: moment().add(1, 'hour').format(),
      });

      isAuthorized(req, res, next)
        .then(() => {
          expect(next.calledOnce).to.be.true;
          expect(res.redirect.called).to.be.false;
          expect(refreshStub.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 3: should redirect to auth provider to get new tokens when access token exists but is expired with no refresh token', (done) => {
      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'expired-token',
        accessTokenExpires: moment().subtract(1, 'hour').format(),
      });

      isAuthorized(req, res, next)
        .then(() => {
          expect(res.redirect.calledOnce).to.be.true;
          expect(res.redirect.calledWith('/auth/test_provider')).to.be.true;
          expect(next.called).to.be.false;
          expect(refreshStub.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 4: should handle expired access token with never-expiring refresh token (no expiration value)', (done) => {
      const newAccessToken = 'new-access-token';
      refreshStub.callsFake((provider, refreshToken, callback) => {
        callback(null, newAccessToken, null, { expires_in: 3600 });
      });

      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        accessTokenExpires: moment().subtract(1, 'hour').format(),
      });

      isAuthorized(req, res, next)
        .then(() => {
          expect(refreshStub.calledOnce).to.be.true;
          expect(refreshStub.calledWith('test_provider', 'valid-refresh-token')).to.be.true;
          expect(next.calledOnce).to.be.true;
          expect(res.redirect.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 5: should handle expired access token with non-expired refresh token', (done) => {
      const newAccessToken = 'new-access-token';
      refreshStub.callsFake((provider, refreshToken, callback) => {
        callback(null, newAccessToken, null, { expires_in: 3600 });
      });

      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        refreshTokenExpires: moment().add(1, 'day').format(),
        accessTokenExpires: moment().subtract(1, 'hour').format(),
      });

      isAuthorized(req, res, next)
        .then(() => {
          expect(refreshStub.calledOnce).to.be.true;
          expect(next.calledOnce).to.be.true;
          expect(res.redirect.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 6: should redirect to auth provider to get new tokens when both access and refresh tokens are expired', (done) => {
      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token',
        refreshTokenExpires: moment().subtract(1, 'day').format(),
        accessTokenExpires: moment().subtract(1, 'hour').format(),
      });

      isAuthorized(req, res, next)
        .then(() => {
          expect(res.redirect.calledOnce).to.be.true;
          expect(res.redirect.calledWith('/auth/test_provider')).to.be.true;
          expect(next.called).to.be.false;
          expect(refreshStub.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 7: should redirect to auth provider to get new tokens when refresh token exists but refresh attempt fails', (done) => {
      refreshStub.callsFake((provider, refreshToken, callback) => {
        callback(new Error('Refresh token failed'));
      });

      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh-token',
        accessTokenExpires: moment().subtract(1, 'hour').format(),
      });

      isAuthorized(req, res, next)
        .then(() => {
          expect(refreshStub.calledOnce).to.be.true;
          expect(res.redirect.calledOnce).to.be.true;
          expect(res.redirect.calledWith('/auth/test_provider')).to.be.true;
          expect(next.called).to.be.false;
          done();
        })
        .catch(done);
    });
  });

  describe('_saveOAuth2UserTokens Tests:', () => {
    let req;
    let userStub;

    beforeEach((done) => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
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

    it('Scenario 1: should add new tokens when user has no tokens for provider', (done) => {
      const accessToken = 'new-access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = 8726400;
      const providerName = 'quickbooks';
      const tokenConfig = { quickbooks: 'some-realm-id' };

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
        .then(() => {
          expect(req.user.tokens).to.have.lengthOf(1);
          expect(req.user.tokens[0]).to.include({
            kind: 'quickbooks',
            accessToken: 'new-access-token',
            refreshToken: 'refresh-token',
          });
          expect(req.user.quickbooks).to.equal('some-realm-id');
          expect(req.user.markModified.calledWith('tokens')).to.be.true;
          expect(req.user.save.calledOnce).to.be.true;
          done();
        })
        .catch(done);
    });

    it('Scenario 2: should update existing access token for provider', (done) => {
      req.user.tokens.push({
        kind: 'google',
        accessToken: 'old-access-token',
        accessTokenExpires: moment().add(1, 'hour').format(),
      });

      const accessToken = 'new-access-token';
      const refreshToken = undefined;
      const accessTokenExpiration = 3599;
      const refreshTokenExpiration = null;
      const providerName = 'google';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens).to.have.lengthOf(1);
          expect(req.user.tokens[0].accessToken).to.equal('new-access-token');
          expect(req.user.tokens[0].refreshToken).to.be.undefined;
          done();
        })
        .catch(done);
    });

    it('Scenario 3: should handle refresh token when provided', (done) => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 2592000;
      const refreshTokenExpiration = 31536000;
      const providerName = 'quickbooks';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens[0].refreshToken).to.equal('refresh-token');
          expect(moment(req.user.tokens[0].refreshTokenExpires).isSame(moment().add(refreshTokenExpiration, 'seconds'), 'minute')).to.be.true;
          done();
        })
        .catch(done);
    });

    it('Scenario 4: should not remove existing refresh token if one has not been provided and we have an existing refresh token', (done) => {
      req.user.tokens.push({
        kind: 'google',
        accessToken: 'old-access-token',
        refreshToken: 'existing-refresh-token',
      });

      const accessToken = 'new-access-token';
      const refreshToken = undefined;
      const accessTokenExpiration = 3599;
      const refreshTokenExpiration = null;
      const providerName = 'google';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens[0].refreshToken).to.equal('existing-refresh-token');
          done();
        })
        .catch(done);
    });

    it('Scenario 5: should correctly convert expiration times from seconds', (done) => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = 8726400;
      const providerName = 'quickbooks';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          const expectedAccessExpiration = moment().add(accessTokenExpiration, 'seconds').format();
          const expectedRefreshExpiration = moment().add(refreshTokenExpiration, 'seconds').format();

          expect(moment(req.user.tokens[0].accessTokenExpires).isSame(expectedAccessExpiration, 'minute')).to.be.true;
          expect(moment(req.user.tokens[0].refreshTokenExpires).isSame(expectedRefreshExpiration, 'minute')).to.be.true;
          done();
        })
        .catch(done);
    });

    it('Scenario 6a: should handle access token without expiration', (done) => {
      const accessToken = 'access-token';
      const refreshToken = undefined;
      const accessTokenExpiration = null;
      const refreshTokenExpiration = null;
      const providerName = 'test_provider';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens[0].accessToken).to.equal('access-token');
          expect(req.user.tokens[0].accessTokenExpires).to.be.undefined;
          done();
        })
        .catch(done);
    });

    it('Scenario 6b: should handle refresh token without expiration', (done) => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = null;
      const providerName = 'test_provider';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens[0].refreshToken).to.equal('refresh-token');
          expect(req.user.tokens[0].refreshTokenExpires).to.be.undefined;
          expect(req.user.tokens[0].accessTokenExpires).to.not.be.undefined;
          done();
        })
        .catch(done);
    });

    it('Scenario 7a: should clear access token expiration when updating with a new access token that has no expiration', (done) => {
      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'old-access-token',
        accessTokenExpires: moment().add(1, 'hour').format(),
      });

      const accessToken = 'new-access-token';
      const refreshToken = undefined;
      const accessTokenExpiration = null;
      const refreshTokenExpiration = null;
      const providerName = 'test_provider';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens[0].accessTokenExpires).to.be.undefined;
          done();
        })
        .catch(done);
    });

    it('Scenario 7b: should clear refresh token expiration when updating with a new refresh token that has no expiration', (done) => {
      req.user.tokens.push({
        kind: 'test_provider',
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        accessTokenExpires: moment().add(1, 'hour').format(),
        refreshTokenExpires: moment().add(1, 'day').format(),
      });

      const accessToken = 'new-access-token';
      const refreshToken = 'new-refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = null;
      const providerName = 'test_provider';

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName)
        .then(() => {
          expect(req.user.tokens[0].refreshTokenExpires).to.be.undefined;
          expect(req.user.tokens[0].accessTokenExpires).to.not.be.undefined;
          done();
        })
        .catch(done);
    });

    it('Scenario 8: should correctly associate provider account ID with token if a provider account ID is provided', (done) => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = 8726400;
      const providerName = 'quickbooks';
      const tokenConfig = { quickbooks: 'some-realm-id' };

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
        .then(() => {
          expect(req.user.tokens[0].kind).to.equal('quickbooks');
          expect(req.user.quickbooks).to.equal('some-realm-id');
          expect(req.user.markModified.calledWith('tokens')).to.be.true;
          done();
        })
        .catch(done);
    });

    it('Scenario 9: should correctly save token to the right user', (done) => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = 8726400;
      const providerName = 'quickbooks';
      const tokenConfig = { quickbooks: 'some-realm-id' };

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
        .then(() => {
          // Verify that findById was called with the correct user ID
          expect(userStub.calledWith(req.user._id)).to.be.true;

          // Verify that the token was saved to the correct user
          expect(req.user.tokens[0]).to.include({
            kind: 'quickbooks',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          });

          // Verify that the user document was properly marked as modified and saved
          expect(req.user.markModified.calledWith('tokens')).to.be.true;
          expect(req.user.save.calledOnce).to.be.true;

          done();
        })
        .catch(done);
    });

    it('Scenario 10: should preserve other provider tokens when updating', (done) => {
      // Setup existing tokens for different providers
      req.user.tokens = [
        {
          kind: 'facebook',
          accessToken: 'facebook-token',
          accessTokenExpires: moment().add(1, 'hour').format(),
        },
        {
          kind: 'github',
          accessToken: 'github-token',
          accessTokenExpires: moment().add(1, 'hour').format(),
        },
      ];

      const accessToken = 'new-google-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3599;
      const refreshTokenExpiration = null;
      const providerName = 'google';
      const tokenConfig = {};

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
        .then(() => {
          expect(req.user.tokens).to.have.lengthOf(3);
          expect(req.user.tokens.find((t) => t.kind === 'facebook').accessToken).to.equal('facebook-token');
          expect(req.user.tokens.find((t) => t.kind === 'github').accessToken).to.equal('github-token');
          expect(req.user.tokens.find((t) => t.kind === 'google').accessToken).to.equal('new-google-token');
          done();
        })
        .catch(done);
    });

    it('Scenario 11: should maintain token data structure consistency', (done) => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 2592000;
      const refreshTokenExpiration = 31536000;
      const providerName = 'quickbooks';
      const tokenConfig = {};

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
        .then(() => {
          const token = req.user.tokens[0];

          // Check for expected properties
          expect(token).to.have.property('kind');
          expect(token).to.have.property('accessToken');
          expect(token).to.have.property('accessTokenExpires');
          expect(token).to.have.property('refreshToken');
          expect(token).to.have.property('refreshTokenExpires');

          // Verify no unexpected properties
          const expectedKeys = ['kind', 'accessToken', 'accessTokenExpires', 'refreshToken', 'refreshTokenExpires'];
          expect(Object.keys(token).sort()).to.deep.equal(expectedKeys.sort());

          // Verify correct types
          expect(token.kind).to.be.a('string');
          expect(token.accessToken).to.be.a('string');
          expect(token.refreshToken).to.be.a('string');
          expect(moment(token.accessTokenExpires).isValid()).to.be.true;
          expect(moment(token.refreshTokenExpires).isValid()).to.be.true;

          done();
        })
        .catch(done);
    });

    it('Scenario 12: should handle new unsaved user (when creating a new user instead of linking a provider to an existing user)', (done) => {
      // Create a new user that hasn't been saved to the database yet
      const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'newuser@gmail.com',
        google: 'google-id-123',
        tokens: [],
      });
      newUser.save = sinon.stub().resolves();
      newUser.markModified = sinon.spy();

      // Simulate the case where findById returns null (user not in database yet)
      userStub.restore(); // Remove the previous stub
      userStub = sinon.stub(User, 'findById').resolves(null);

      req.user = newUser;

      const accessToken = 'new-google-token';
      const refreshToken = 'refresh-token';
      const accessTokenExpiration = 3600;
      const refreshTokenExpiration = null;
      const providerName = 'google';
      const tokenConfig = {};

      _saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig)
        .then((savedUser) => {
          expect(savedUser.tokens).to.be.an('array');
          expect(savedUser.tokens).to.have.lengthOf(1);
          expect(savedUser.tokens[0]).to.include({
            kind: 'google',
            accessToken: 'new-google-token',
            refreshToken: 'refresh-token',
          });
          expect(moment(savedUser.tokens[0].accessTokenExpires).isValid()).to.be.true;
          expect(savedUser.markModified.calledWith('tokens')).to.be.true;
          expect(savedUser.save.calledOnce).to.be.true;
          done();
        })
        .catch(done);
    });
  });
});
