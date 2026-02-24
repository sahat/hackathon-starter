/* eslint-disable global-require */
const crypto = require('node:crypto');
const path = require('node:path');
const { expect } = require('chai');
const sinon = require('sinon');
const { generateRegistrationOptions, generateAuthenticationOptions } = require('@simplewebauthn/server');

process.loadEnvFile(path.join(__dirname, '.env.test'));

describe('WebAuthn Controller', () => {
  let generateRegistrationOptionsStub;
  let verifyRegistrationResponseStub;
  let generateAuthenticationOptionsStub;
  let verifyAuthenticationResponseStub;
  let cryptoRandomBytesStub;
  let userFindOneStub;
  let userSaveStub;
  let originalRequire;

  beforeEach(() => {
    generateRegistrationOptionsStub = sinon.stub();
    verifyRegistrationResponseStub = sinon.stub();
    generateAuthenticationOptionsStub = sinon.stub();
    verifyAuthenticationResponseStub = sinon.stub();
    cryptoRandomBytesStub = sinon.stub(crypto, 'randomBytes');
    userFindOneStub = sinon.stub();
    userSaveStub = sinon.stub().resolves();

    const Module = require('module');
    originalRequire = Module.prototype.require;

    Module.prototype.require = function (id) {
      if (id === '@simplewebauthn/server') {
        return {
          generateRegistrationOptions: generateRegistrationOptionsStub,
          verifyRegistrationResponse: verifyRegistrationResponseStub,
          generateAuthenticationOptions: generateAuthenticationOptionsStub,
          verifyAuthenticationResponse: verifyAuthenticationResponseStub,
        };
      }
      if (id === '../models/User') {
        return { findOne: userFindOneStub };
      }
      return originalRequire.apply(this, arguments);
    };
  });

  afterEach(() => {
    const Module = require('module');
    Module.prototype.require = originalRequire;
    sinon.restore();
  });

  describe('Controller Unit Tests', () => {
    let webauthnController;

    beforeEach(() => {
      delete require.cache[require.resolve('../controllers/webauthn')];
      webauthnController = require('../controllers/webauthn');
    });

    describe('postRegisterStart', () => {
      let req;
      let res;

      beforeEach(() => {
        req = {
          user: {
            emailVerified: true,
            webauthnUserID: null,
            webauthnCredentials: [],
            email: 'test@example.com',
            profile: { name: 'Test User' },
            save: userSaveStub,
          },
          session: {},
          flash: sinon.spy(),
        };
        res = { render: sinon.spy(), redirect: sinon.spy() };
      });

      it('Scenario 1: Generates webauthnUserID when missing', (done) => {
        const mockUserID = Buffer.from('mock-user-id-32-bytes-long');
        cryptoRandomBytesStub.returns(mockUserID);
        generateRegistrationOptionsStub.resolves({
          challenge: 'test-challenge-123',
          user: { id: mockUserID },
        });

        webauthnController
          .postRegisterStart(req, res)
          .then(() => {
            expect(cryptoRandomBytesStub.calledOnceWith(32)).to.be.true;
            expect(req.user.webauthnUserID).to.equal(mockUserID);
            expect(userSaveStub.calledOnce).to.be.true;
            expect(generateRegistrationOptionsStub.calledOnce).to.be.true;
            expect(req.session.registerChallenge).to.equal('test-challenge-123');
            expect(res.render.calledOnce).to.be.true;
            expect(res.render.firstCall.args[0]).to.equal('account/webauthn-register');
            done();
          })
          .catch(done);
      });

      it('Scenario 2: Does not regenerate webauthnUserID if already present', (done) => {
        const existingUserID = Buffer.from('existing-user-id-32-bytes');
        req.user.webauthnUserID = existingUserID;
        generateRegistrationOptionsStub.resolves({
          challenge: 'test-challenge-456',
          user: { id: existingUserID },
        });

        webauthnController
          .postRegisterStart(req, res)
          .then(() => {
            expect(cryptoRandomBytesStub.called).to.be.false;
            expect(userSaveStub.called).to.be.false;
            expect(req.user.webauthnUserID).to.equal(existingUserID);
            done();
          })
          .catch(done);
      });

      it('Scenario 3: Passes existing credentials to excludeCredentials', (done) => {
        const mockUserID = Buffer.from('mock-user-id-32-bytes-long');
        req.user.webauthnUserID = mockUserID;
        const cred1Id = Buffer.from('credential-id-1');
        const cred2Id = Buffer.from('credential-id-2');
        req.user.webauthnCredentials = [
          { credentialId: cred1Id, transports: ['usb', 'nfc'] },
          { credentialId: cred2Id, transports: ['ble'] },
        ];
        generateRegistrationOptionsStub.resolves({
          challenge: 'test-challenge-789',
          user: { id: mockUserID },
        });

        webauthnController
          .postRegisterStart(req, res)
          .then(() => {
            const callArgs = generateRegistrationOptionsStub.firstCall.args[0];
            expect(callArgs.excludeCredentials).to.have.length(2);
            expect(callArgs.excludeCredentials[0].id).to.equal(cred1Id);
            expect(callArgs.excludeCredentials[1].id).to.equal(cred2Id);
            done();
          })
          .catch(done);
      });

      it('Scenario 4: Stores challenge and renders registration page', (done) => {
        const mockUserID = Buffer.from('mock-user-id-32-bytes-long');
        req.user.webauthnUserID = mockUserID;
        const mockOptions = { challenge: 'test-challenge-123', user: { id: mockUserID } };
        generateRegistrationOptionsStub.resolves(mockOptions);

        webauthnController
          .postRegisterStart(req, res)
          .then(() => {
            expect(req.session.registerChallenge).to.equal('test-challenge-123');
            expect(res.render.calledOnce).to.be.true;
            expect(res.render.firstCall.args[0]).to.equal('account/webauthn-register');
            done();
          })
          .catch(done);
      });

      it('Scenario 5: Error handling redirects to /account', (done) => {
        const mockUserID = Buffer.from('mock-user-id-32-bytes-long');
        req.user.webauthnUserID = mockUserID;
        generateRegistrationOptionsStub.rejects(new Error('WebAuthn error'));

        webauthnController
          .postRegisterStart(req, res)
          .then(() => {
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/account');
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[0]).to.equal('errors');
            expect(req.flash.firstCall.args[1].msg.length).to.greaterThan(0);
            done();
          })
          .catch(done);
      });

      it('Scenario 6: Rejects registration start when email is not verified', async () => {
        req.user.emailVerified = false;
        await webauthnController.postRegisterStart(req, res);
        expect(req.user.webauthnCredentials).to.have.length(0);
        expect(res.redirect.calledOnceWith('/account')).to.be.true;
        expect(req.session.registerChallenge).to.be.undefined;
        expect(generateRegistrationOptionsStub.called).to.be.false;
      });
    });

    describe('postRegisterVerify', () => {
      let req;
      let res;

      beforeEach(() => {
        req = {
          body: {},
          user: { emailVerified: true, webauthnCredentials: [], save: userSaveStub },
          session: {},
          flash: sinon.spy(),
        };
        res = { redirect: sinon.spy() };
      });

      it('Scenario 1: Missing credential or challenge', (done) => {
        req.session.registerChallenge = 'test-challenge';

        webauthnController
          .postRegisterVerify(req, res)
          .then(() => {
            expect(req.session.registerChallenge).to.be.undefined;
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[1].msg).to.equal('Registration failed. Please try again.');
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/account');
            expect(verifyRegistrationResponseStub.called).to.be.false;
            done();
          })
          .catch(done);
      });

      it('Scenario 4: Successful registration', (done) => {
        req.body.credential = JSON.stringify({
          id: 'test-credential-id',
          rawId: 'test-raw-id',
          response: {},
        });
        req.session.registerChallenge = 'test-challenge';
        verifyRegistrationResponseStub.resolves({
          verified: true,
          registrationInfo: {
            credential: {
              id: 'test-credential-id',
              publicKey: Buffer.from([0x01, 0x02, 0x03]),
              counter: 5,
              transports: ['usb', 'nfc'],
            },
            credentialDeviceType: 'single-device',
            credentialBackedUp: false,
          },
        });

        webauthnController
          .postRegisterVerify(req, res)
          .then(() => {
            expect(req.user.webauthnCredentials).to.have.length(1);
            expect(Buffer.isBuffer(req.user.webauthnCredentials[0].publicKey)).to.equal(true);
            expect(userSaveStub.calledOnce).to.be.true;
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[1].msg).to.equal('Biometric login has been enabled successfully.');
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/account');
            done();
          })
          .catch(done);
      });

      it('Scenario 5: Rejects duplicate credentialId on same user', (done) => {
        const existingCredentialId = Buffer.from('existing-credential-id');
        req.user.webauthnCredentials = [
          {
            credentialId: existingCredentialId,
            publicKey: Buffer.from([0x01, 0x02, 0x03]),
            counter: 5,
            transports: ['usb'],
          },
        ];
        req.body.credential = JSON.stringify({
          id: existingCredentialId.toString('base64url'),
          rawId: existingCredentialId.toString('base64url'),
          response: {},
        });
        req.session.registerChallenge = 'test-challenge';
        verifyRegistrationResponseStub.resolves({
          verified: true,
          registrationInfo: {
            credential: {
              id: existingCredentialId.toString('base64url'),
              publicKey: Buffer.from([0x04, 0x05, 0x06]),
              counter: 10,
              transports: ['nfc'],
            },
            credentialDeviceType: 'single-device',
            credentialBackedUp: false,
          },
        });

        webauthnController
          .postRegisterVerify(req, res)
          .then(() => {
            expect(req.user.webauthnCredentials).to.have.length(1); // Still only 1 credential
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[1].msg).to.equal('This passkey is already registered to your account.');
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/account');
            expect(userSaveStub.called).to.be.false; // Should not save
            done();
          })
          .catch(done);
      });

      it('Scenario 6: Handles Mongo E11000 duplicate key error', (done) => {
        req.body.credential = JSON.stringify({
          id: 'test-credential-id',
          rawId: 'test-raw-id',
          response: {},
        });
        req.session.registerChallenge = 'test-challenge';
        verifyRegistrationResponseStub.resolves({
          verified: true,
          registrationInfo: {
            credential: {
              id: 'test-credential-id',
              publicKey: Buffer.from([0x01, 0x02, 0x03]),
              counter: 5,
              transports: ['usb', 'nfc'],
            },
            credentialDeviceType: 'single-device',
            credentialBackedUp: false,
          },
        });
        userSaveStub.rejects({ code: 11000 });

        webauthnController
          .postRegisterVerify(req, res)
          .then(() => {
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[1].msg).to.equal('This passkey is already registered to an account.');
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/account');
            done();
          })
          .catch(done);
      });

      it('Scenario 7: Rejects registration verify when email is not verified', async () => {
        req.user.emailVerified = false;
        req.body.credential = JSON.stringify({ id: 'x', response: {} });
        req.session.registerChallenge = 'test-challenge';

        await webauthnController.postRegisterVerify(req, res);

        expect(res.redirect.calledOnceWith('/account')).to.be.true;
        expect(req.flash.calledOnce).to.be.true;
        expect(userSaveStub.called).to.be.false;
        expect(verifyRegistrationResponseStub.called).to.be.false;
        expect(req.session.registerChallenge).to.equal('test-challenge');
      });
    });

    describe('postLoginStart', () => {
      let req;
      let res;

      beforeEach(() => {
        req = { body: {}, session: {}, flash: sinon.spy() };
        res = { render: sinon.spy(), redirect: sinon.spy() };
      });

      it('Scenario 1: Sets email scoping when enabled', (done) => {
        req.body.email = 'test@example.com';
        req.body.useEmailWithBiometrics = true;
        generateAuthenticationOptionsStub.resolves({
          challenge: 'login-challenge-123',
          allowCredentials: [],
          userVerification: 'preferred',
        });

        webauthnController
          .postLoginStart(req, res)
          .then(() => {
            expect(req.session.webauthnLoginEmail).to.equal('test@example.com');
            expect(generateAuthenticationOptionsStub.calledOnce).to.be.true;
            expect(userFindOneStub.called).to.be.false;
            done();
          })
          .catch(done);
      });

      it('Scenario 2: Generates challenge and renders login page', (done) => {
        req.body.useEmailWithBiometrics = false;
        const mockOptions = {
          challenge: 'login-challenge-123',
          allowCredentials: [],
          userVerification: 'preferred',
        };
        generateAuthenticationOptionsStub.resolves(mockOptions);

        webauthnController
          .postLoginStart(req, res)
          .then(() => {
            expect(req.session.loginChallenge).to.equal('login-challenge-123');
            expect(res.render.calledOnce).to.be.true;
            expect(res.render.firstCall.args[0]).to.equal('account/webauthn-login');
            expect(userFindOneStub.called).to.be.false;
            done();
          })
          .catch(done);
      });
    });

    describe('postLoginVerify', () => {
      let req;
      let res;

      beforeEach(() => {
        req = {
          body: {},
          session: {
            loginChallenge: 'test-challenge',
            webauthnLoginEmail: null,
            returnTo: null,
          },
          flash: sinon.spy(),
          logIn: sinon.stub().callsArg(1),
        };
        res = { redirect: sinon.spy() };
      });

      it('Scenario 1: Missing credential or challenge', (done) => {
        delete req.body.credential;

        webauthnController
          .postLoginVerify(req, res)
          .then(() => {
            expect(req.session.loginChallenge).to.be.undefined;
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[1].msg).to.equal('Passkey / Biometric authentication failed - invalid request.');
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/login');
            expect(userFindOneStub.called).to.be.false;
            expect(verifyAuthenticationResponseStub.called).to.be.false;
            done();
          })
          .catch(done);
      });

      it('Scenario 5: Successful login', (done) => {
        req.body.credential = JSON.stringify({
          id: 'test-credential-id',
          rawId: 'test-raw-id',
          response: {},
        });
        req.session.loginChallenge = 'test-challenge';
        req.session.returnTo = '/dashboard';
        const mockUser = {
          webauthnCredentials: [
            {
              credentialId: Buffer.from('test-credential-id', 'base64url'),
              publicKey: Buffer.from('test-public-key'),
              counter: 0,
              transports: [],
            },
          ],
          email: 'test@example.com',
          save: userSaveStub,
        };
        userFindOneStub.resolves(mockUser);
        verifyAuthenticationResponseStub.resolves({
          verified: true,
          authenticationInfo: { newCounter: 5 },
        });

        webauthnController
          .postLoginVerify(req, res)
          .then(() => {
            expect(mockUser.webauthnCredentials[0].counter).to.equal(5);
            expect(userSaveStub.calledOnce).to.be.true;
            expect(req.logIn.calledOnce).to.be.true;
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[1].msg).to.equal('Success! You are logged in.');
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/dashboard');
            done();
          })
          .catch(done);
      });
    });

    describe('postRemove', () => {
      let req;
      let res;

      beforeEach(() => {
        req = {
          user: {
            webauthnCredentials: [
              {
                credentialId: Buffer.from('test-credential-id'),
                publicKey: Buffer.from('test-public-key'),
                counter: 5,
                transports: ['usb'],
              },
            ],
            webauthnUserID: Buffer.from('test-user-id'),
            save: userSaveStub,
          },
          flash: sinon.spy(),
        };
        res = { redirect: sinon.spy() };
      });

      it('Scenario 1: Clears credentials and userID', (done) => {
        webauthnController
          .postRemove(req, res)
          .then(() => {
            expect(req.user.webauthnCredentials).to.deep.equal([]);
            expect(req.user.webauthnUserID).to.be.undefined;
            expect(userSaveStub.calledOnce).to.be.true;
            expect(res.redirect.calledOnce).to.be.true;
            expect(res.redirect.firstCall.args[0]).to.equal('/account');
            expect(req.flash.calledOnce).to.be.true;
            expect(req.flash.firstCall.args[0]).to.equal('success');
            expect(req.flash.firstCall.args[1].msg.length).to.greaterThan(0);
            done();
          })
          .catch(done);
      });
    });
  });
});

describe('WebAuthn Contract Tests (Real @simplewebauthn/server)', () => {
  describe('Registration Options Generation', () => {
    it('generates valid registration options', async () => {
      const rpID = 'localhost';
      const rpName = 'Test App';
      const userID = Buffer.from('test-user-id-32-bytes-long');
      const userName = 'test@example.com';
      const userDisplayName = 'Test User';

      const options = await generateRegistrationOptions({
        rpID,
        rpName,
        userID,
        userName,
        userDisplayName,
      });

      expect(options).to.be.an('object');
      expect(options.challenge).to.be.a('string').that.is.not.empty;
      expect(options.rp).to.deep.include({ id: rpID, name: rpName });
      expect(options.user.id).to.be.a('string'); // Library converts Buffer to base64url
      expect(options.user.name).to.equal(userName);
      expect(options.user.displayName).to.equal(userDisplayName);
      expect(() => JSON.stringify(options)).to.not.throw();
    });

    it('handles excludeCredentials correctly', async () => {
      const credentialId1 = Buffer.from('credential-id-1').toString('base64url');
      const credentialId2 = Buffer.from('credential-id-2').toString('base64url');
      const excludeCredentials = [
        {
          id: credentialId1,
          type: 'public-key',
          transports: ['usb', 'nfc'],
        },
        {
          id: credentialId2,
          type: 'public-key',
          transports: ['ble'],
        },
      ];

      const options = await generateRegistrationOptions({
        rpID: 'localhost',
        rpName: 'Test App',
        userID: Buffer.from('test-user-id-32-bytes-long'),
        userName: 'test@example.com',
        userDisplayName: 'Test User',
        excludeCredentials,
      });

      expect(options.excludeCredentials).to.be.an('array').with.length(2);
      expect(options.excludeCredentials[0]).to.deep.include({
        id: credentialId1,
        type: 'public-key',
        transports: ['usb', 'nfc'],
      });
      expect(options.excludeCredentials[1]).to.deep.include({
        id: credentialId2,
        type: 'public-key',
        transports: ['ble'],
      });
      expect(() => JSON.stringify(options)).to.not.throw();
    });
  });

  describe('Authentication Options Generation', () => {
    it('generates valid authentication options', async () => {
      const rpID = 'localhost';
      const allowCredentials = [
        {
          id: 'Y3JlZGVudGlhbC1pZA', // base64url encoded
          type: 'public-key',
          transports: ['usb'],
        },
      ];

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
      });

      expect(options).to.be.an('object');
      expect(options.challenge).to.be.a('string').that.is.not.empty;
      expect(options.allowCredentials).to.be.an('array');
      expect(() => JSON.stringify(options)).to.not.throw();
    });

    it('handles empty allowCredentials', async () => {
      const rpID = 'localhost';

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: [],
      });

      expect(options.allowCredentials).to.be.an('array').that.is.empty;
      expect(options.challenge).to.be.a('string').that.is.not.empty;
      expect(() => JSON.stringify(options)).to.not.throw();
    });
  });
});
