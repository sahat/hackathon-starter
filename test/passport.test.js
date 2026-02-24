const path = require('node:path');
const { expect } = require('chai');
const sinon = require('sinon');
const refresh = require('passport-oauth2-refresh');
const mongoose = require('mongoose');
const validator = require('validator');
process.loadEnvFile(path.join(__dirname, '.env.test'));
const passportModule = require('../config/passport');
const { isAuthorized, _saveOAuth2UserTokens, _handleAuthLogin } = passportModule;
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
        accessTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
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
        accessTokenExpires: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        accessTokenExpires: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        refreshTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        accessTokenExpires: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        refreshTokenExpires: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        accessTokenExpires: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        accessTokenExpires: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        accessTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
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
          {
            const expectedRefresh = new Date(Date.now() + refreshTokenExpiration * 1000).toISOString();
            const diffMinutes = Math.abs(new Date(req.user.tokens[0].refreshTokenExpires).getTime() - new Date(expectedRefresh).getTime()) / 60000;
            expect(diffMinutes).to.be.lessThan(1);
          }
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
          const expectedAccessExpiration = new Date(Date.now() + accessTokenExpiration * 1000).toISOString();
          const expectedRefreshExpiration = new Date(Date.now() + refreshTokenExpiration * 1000).toISOString();
          {
            const diffMinutesA = Math.abs(new Date(req.user.tokens[0].accessTokenExpires).getTime() - new Date(expectedAccessExpiration).getTime()) / 60000;
            const diffMinutesR = Math.abs(new Date(req.user.tokens[0].refreshTokenExpires).getTime() - new Date(expectedRefreshExpiration).getTime()) / 60000;
            expect(diffMinutesA).to.be.lessThan(1);
            expect(diffMinutesR).to.be.lessThan(1);
          }
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
        accessTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
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
        accessTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        refreshTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
          accessTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          kind: 'github',
          accessToken: 'github-token',
          accessTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
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
          expect(!isNaN(Date.parse(token.accessTokenExpires))).to.be.true;
          expect(!isNaN(Date.parse(token.refreshTokenExpires))).to.be.true;

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
          expect(!isNaN(Date.parse(savedUser.tokens[0].accessTokenExpires))).to.be.true;
          expect(savedUser.markModified.calledWith('tokens')).to.be.true;
          expect(savedUser.save.calledOnce).to.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('handleAuthLogin Tests', () => {
    let req;
    let userFindOneStub;
    let userFindByIdStub;
    let validatorStub;
    let UserSaveStub;
    let UserMarkModifiedStub;

    beforeEach((done) => {
      req = {
        user: null,
      };

      userFindOneStub = sinon.stub(User, 'findOne');
      userFindByIdStub = sinon.stub(User, 'findById');
      validatorStub = sinon.stub(validator, 'normalizeEmail');

      done();
    });

    afterEach((done) => {
      userFindOneStub.restore();
      userFindByIdStub.restore();
      validatorStub.restore();
      if (UserSaveStub && UserSaveStub.restore) {
        UserSaveStub.restore();
        UserSaveStub = null;
      }
      if (UserMarkModifiedStub && UserMarkModifiedStub.restore) {
        UserMarkModifiedStub.restore();
        UserMarkModifiedStub = null;
      }
      done();
    });

    it('Scenario 1: Link flow - successful provider link', (done) => {
      const existingUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'existing@example.com',
        google: undefined,
        profile: {
          name: 'Old Name',
          gender: '',
          picture: '',
        },
        tokens: [],
      });
      existingUser.save = sinon.stub().resolves();
      existingUser.markModified = sinon.spy();

      req.user = existingUser;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-123',
        name: 'John Doe',
        gender: 'male',
        picture: 'https://example.com/photo.jpg',
        email: 'john@example.com',
      };

      // No existing user with this provider ID (collision check passes)
      userFindOneStub.resolves(null);

      // findById returns the existing user for saveOAuth2UserTokens
      userFindByIdStub.resolves(existingUser);

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, true, null, true)
        .then((result) => {
          expect(userFindOneStub.calledOnce).to.be.true;
          expect(userFindOneStub.firstCall.args[0]).to.deep.equal({
            google: { $eq: 'google-provider-id-123' },
          });
          expect(userFindByIdStub.calledOnce).to.be.true;
          expect(result.google).to.equal('google-provider-id-123');
          expect(result.profile.name).to.equal('Old Name'); // Fallback keeps existing
          expect(result.profile.gender).to.equal('male'); // Fallback assigns new
          expect(result.profile.picture).to.equal('https://example.com/photo.jpg'); // Fallback assigns new
          expect(existingUser.save.calledTwice).to.be.true; // Called by saveOAuth2UserTokens and handleAuthLogin
          expect(result).to.equal(existingUser);
          done();
        })
        .catch(done);
    });

    it('Scenario 2: Link flow - provider collision', (done) => {
      const currentUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'current@example.com',
        google: undefined,
        tokens: [],
      });
      currentUser.save = sinon.stub().resolves();

      const otherUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'other@example.com',
        google: 'google-provider-id-123',
        tokens: [],
      });

      req.user = currentUser;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-123',
        name: 'John Doe',
        gender: 'male',
        picture: 'https://example.com/photo.jpg',
        email: 'john@example.com',
      };

      // Another user already has this provider ID
      userFindOneStub.resolves(otherUser);

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, true, null, true)
        .then(() => {
          done(new Error('Expected function to throw PROVIDER_COLLISION error'));
        })
        .catch((err) => {
          expect(err.message).to.equal('PROVIDER_COLLISION');
          expect(userFindOneStub.calledOnce).to.be.true;
          expect(userFindByIdStub.called).to.be.false;
          expect(currentUser.save.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 3: Login flow - returning user by provider ID', (done) => {
      const existingUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'existing@example.com',
        google: 'google-provider-id-123',
        profile: {
          name: 'John Doe',
          gender: 'male',
          picture: 'https://example.com/photo.jpg',
        },
        tokens: [],
      });
      existingUser.save = sinon.stub().resolves();
      existingUser.markModified = sinon.spy();

      // No logged-in user (login flow)
      req.user = null;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-123',
        name: 'John Doe',
        gender: 'male',
        picture: 'https://example.com/photo.jpg',
        email: 'existing@example.com',
      };

      // User found by provider ID
      userFindOneStub.resolves(existingUser);

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, false, null, true)
        .then((result) => {
          expect(userFindOneStub.calledOnce).to.be.true;
          expect(userFindOneStub.firstCall.args[0]).to.deep.equal({
            google: { $eq: 'google-provider-id-123' },
          });
          expect(result).to.equal(existingUser);
          expect(userFindByIdStub.called).to.be.false;
          expect(existingUser.save.called).to.be.false;
          expect(existingUser.markModified.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 4: Login flow - email collision', (done) => {
      // No logged-in user (login flow)
      req.user = null;

      const existingEmailUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'john@example.com',
        google: undefined,
        tokens: [],
      });

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-123',
        name: 'John Doe',
        gender: 'male',
        picture: 'https://example.com/photo.jpg',
        email: 'john@example.com',
      };

      // First call: no user found by provider ID
      // Second call: user found by email
      userFindOneStub.onFirstCall().resolves(null);
      userFindOneStub.onSecondCall().resolves(existingEmailUser);

      validatorStub.returns('john@example.com');

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, false, null, true)
        .then(() => {
          done(new Error('Expected function to throw EMAIL_COLLISION error'));
        })
        .catch((err) => {
          expect(err.message).to.equal('EMAIL_COLLISION');
          expect(userFindOneStub.calledTwice).to.be.true;
          expect(userFindOneStub.firstCall.args[0]).to.deep.equal({
            google: { $eq: 'google-provider-id-123' },
          });
          expect(userFindOneStub.secondCall.args[0]).to.deep.equal({
            email: { $eq: 'john@example.com' },
          });
          expect(validatorStub.calledOnce).to.be.true;
          expect(validatorStub.firstCall.args[0]).to.equal('john@example.com');
          expect(validatorStub.firstCall.args[1]).to.deep.equal({ gmail_remove_dots: false });
          expect(userFindByIdStub.called).to.be.false;
          done();
        })
        .catch(done);
    });

    it('Scenario 5: Login flow - new user creation', (done) => {
      // No logged-in user (login flow)
      req.user = null;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-456',
        name: 'Jane Smith',
        gender: 'female',
        picture: 'https://example.com/jane.jpg',
        email: 'jane@example.com',
      };

      // No user found by provider ID, no user found by email
      userFindOneStub.resolves(null);
      validatorStub.returns('jane@example.com');

      // findById returns null (new user not yet in DB)
      userFindByIdStub.resolves(null);

      // Stub User.prototype.save and markModified
      UserSaveStub = sinon.stub(User.prototype, 'save').resolves();
      UserMarkModifiedStub = sinon.stub(User.prototype, 'markModified');

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, false, null, true)
        .then((result) => {
          expect(userFindOneStub.calledTwice).to.be.true;
          expect(userFindOneStub.firstCall.args[0]).to.deep.equal({
            google: { $eq: 'google-provider-id-456' },
          });
          expect(userFindOneStub.secondCall.args[0]).to.deep.equal({
            email: { $eq: 'jane@example.com' },
          });
          expect(validatorStub.calledOnce).to.be.true;
          expect(userFindByIdStub.calledOnce).to.be.true;
          expect(req.user).to.be.an.instanceof(User);
          expect(req.user.email).to.equal('jane@example.com');
          expect(req.user.google).to.equal('google-provider-id-456');
          expect(req.user.profile.name).to.equal('Jane Smith');
          expect(req.user.profile.gender).to.equal('female');
          expect(req.user.profile.picture).to.equal('https://example.com/jane.jpg');
          expect(UserSaveStub.calledTwice).to.be.true; // Called by saveOAuth2UserTokens and handleAuthLogin
          expect(result).to.equal(req.user);
          done();
        })
        .catch(done);
    });

    it('Scenario 6: Email normalization', (done) => {
      // No logged-in user (login flow)
      req.user = null;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-789',
        name: 'Bob Johnson',
        gender: 'male',
        picture: 'https://example.com/bob.jpg',
        email: 'Bob.Johnson+test@Gmail.com',
      };

      // No user found by provider ID, no user found by normalized email
      userFindOneStub.resolves(null);
      validatorStub.returns('bob.johnson+test@gmail.com');
      userFindByIdStub.resolves(null);

      UserSaveStub = sinon.stub(User.prototype, 'save').resolves();
      UserMarkModifiedStub = sinon.stub(User.prototype, 'markModified');

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, false, null, true)
        .then((result) => {
          expect(validatorStub.calledOnce).to.be.true;
          expect(validatorStub.firstCall.args[0]).to.equal('Bob.Johnson+test@Gmail.com');
          expect(validatorStub.firstCall.args[1]).to.deep.equal({ gmail_remove_dots: false });
          expect(userFindOneStub.calledTwice).to.be.true;
          expect(userFindOneStub.secondCall.args[0]).to.deep.equal({
            email: { $eq: 'bob.johnson+test@gmail.com' },
          });
          expect(userFindByIdStub.calledOnce).to.be.true;
          expect(req.user.email).to.equal('bob.johnson+test@gmail.com');
          expect(result).to.equal(req.user);
          done();
        })
        .catch(done);
    });

    it('Scenario 7: providerProfile.email undefined AND sessionAlreadyLoggedIn = false (should throw EMAIL_REQUIRED)', (done) => {
      // No logged-in user (login flow)
      req.user = null;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-999',
        name: 'No Email User',
        gender: 'male',
        picture: 'https://example.com/nomail.jpg',
        email: undefined,
      };

      // No user found by provider ID
      userFindOneStub.resolves(null);
      // Don't stub validator - let it naturally return undefined for undefined input

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, false, null, true)
        .then(() => {
          done(new Error('Expected EMAIL_REQUIRED error to be thrown'));
        })
        .catch((err) => {
          expect(err.message).to.equal('EMAIL_REQUIRED');
          expect(userFindOneStub.calledOnce).to.be.true;
          done();
        });
    });

    it('Scenario 8: providerProfile.email undefined AND sessionAlreadyLoggedIn = true (should succeed)', (done) => {
      const existingUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'existing@example.com',
        google: undefined,
        profile: {
          name: '', // Empty name so it will be replaced
          gender: '',
          picture: '',
        },
        tokens: [],
      });
      existingUser.save = sinon.stub().resolves();
      existingUser.markModified = sinon.spy();

      req.user = existingUser;

      const accessToken = 'google-access-token';
      const refreshToken = 'google-refresh-token';
      const params = { expires_in: 3600 };
      const providerProfile = {
        id: 'google-provider-id-888',
        name: 'User With No Email',
        picture: 'https://example.com/user.jpg',
        email: undefined,
      };

      // No collision with existing user
      userFindOneStub.resolves(null);
      userFindByIdStub.resolves(null);

      UserSaveStub = sinon.stub(User.prototype, 'save').resolves();
      UserMarkModifiedStub = sinon.stub(User.prototype, 'markModified');

      _handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, true, null, true)
        .then((result) => {
          expect(userFindOneStub.calledOnce).to.be.true;
          expect(result.google).to.equal('google-provider-id-888');
          // Profile name should be updated (empty || User With No Email = User With No Email)
          expect(result.profile.name).to.equal('User With No Email');
          // Save should be called at least once
          const totalSaveCalls = UserSaveStub.callCount + existingUser.save.callCount;
          expect(totalSaveCalls).to.be.at.least(1);
          done();
        })
        .catch(done);
    });

    it('Scenario 9: Link flow - legacy upgrade (no pictures map)', async () => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'legacy@example.com',
        profile: {
          picture: 'old-picture',
        },
        tokens: [],
      });
      user.save = sinon.stub().resolves();
      req.user = user;
      userFindOneStub.resolves(null);
      userFindByIdStub.resolves(user);
      const providerProfile = {
        id: 'facebook-id',
        picture: 'https://facebook/pic.jpg',
      };
      const result = await _handleAuthLogin(req, 'token', null, 'facebook', {}, providerProfile, true, null, true);
      expect(result.profile.pictures).to.be.instanceOf(Map);
      expect(result.profile.pictures.get('facebook')).to.equal('https://facebook/pic.jpg');
      expect(result.profile.picture).to.equal('https://facebook/pic.jpg');
      expect(result.profile.pictureSource).to.equal('facebook');
    });

    it('Scenario 10: Link flow - legacy upgrade (missing pictureSource)', async () => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'legacy@example.com',
        profile: {
          picture: 'old-picture',
          pictures: new Map([['google', 'google-pic']]),
        },
        tokens: [],
      });
      user.save = sinon.stub().resolves();
      req.user = user;
      userFindOneStub.resolves(null);
      userFindByIdStub.resolves(user);
      const providerProfile = {
        id: 'facebook-id',
        picture: 'https://facebook/pic.jpg',
      };
      const result = await _handleAuthLogin(req, 'token', null, 'facebook', {}, providerProfile, true, null, true);
      expect(result.profile.pictureSource).to.equal('facebook');
      expect(result.profile.pictures.get('facebook')).to.equal('https://facebook/pic.jpg');
    });

    it('Scenario 11: Link flow - gravatar upgraded to provider', async () => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'user@example.com',
        profile: {
          picture: 'gravatar-url',
          pictureSource: 'gravatar',
          pictures: new Map([['gravatar', 'gravatar-url']]),
        },
        tokens: [],
      });
      user.save = sinon.stub().resolves();
      req.user = user;
      userFindOneStub.resolves(null);
      userFindByIdStub.resolves(user);
      const providerProfile = {
        id: 'github-id',
        picture: 'https://github/pic.jpg',
      };
      const result = await _handleAuthLogin(req, 'token', null, 'github', {}, providerProfile, true, null, true);
      expect(result.profile.picture).to.equal('https://github/pic.jpg');
      expect(result.profile.pictureSource).to.equal('github');
      expect(result.profile.pictures.get('github')).to.equal('https://github/pic.jpg');
    });

    it('Scenario 12: Link flow - preserve non-gravatar primary picture', async () => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'user@example.com',
        profile: {
          picture: 'google-pic',
          pictureSource: 'google',
          pictures: new Map([['google', 'google-pic']]),
        },
        tokens: [],
      });
      user.save = sinon.stub().resolves();
      req.user = user;
      userFindOneStub.resolves(null);
      userFindByIdStub.resolves(user);
      const providerProfile = {
        id: 'facebook-id',
        picture: 'https://facebook/pic.jpg',
      };
      const result = await _handleAuthLogin(req, 'token', null, 'facebook', {}, providerProfile, true, null, true);
      expect(result.profile.picture).to.equal('google-pic');
      expect(result.profile.pictureSource).to.equal('google');
      expect(result.profile.pictures.get('facebook')).to.equal('https://facebook/pic.jpg');
    });

    it('Scenario 13: Link flow - relink same provider updates picture entry', async () => {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: 'user@example.com',
        profile: {
          picture: 'gravatar-url',
          pictureSource: 'gravatar',
          pictures: new Map([['google', 'old-google-pic']]),
        },
        tokens: [],
      });
      user.save = sinon.stub().resolves();
      req.user = user;
      userFindOneStub.resolves(null);
      userFindByIdStub.resolves(user);
      const providerProfile = {
        id: 'google-id',
        picture: 'new-google-pic',
      };
      const result = await _handleAuthLogin(req, 'token', null, 'google', {}, providerProfile, true, null, true);
      expect(result.profile.pictures.get('google')).to.equal('new-google-pic');
      expect(result.profile.picture).to.equal('new-google-pic');
      expect(result.profile.pictureSource).to.equal('google');
    });
  });
});
