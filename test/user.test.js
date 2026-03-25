/* eslint-disable global-require */
const path = require('node:path');
const { expect } = require('chai');
const sinon = require('sinon');

process.loadEnvFile(path.join(__dirname, '.env.test'));

// ---------------------------------------------------------------------------
// Shared helper: build a minimal Module.prototype.require shim that intercepts
// a set of module IDs and falls back to the real require for everything else.
// ---------------------------------------------------------------------------
function buildRequireShim(overrides) {
  const Module = require('module');
  const original = Module.prototype.require;
  Module.prototype.require = function shimmedRequire(id) {
    if (Object.prototype.hasOwnProperty.call(overrides, id)) {
      return overrides[id];
    }
    return original.apply(this, arguments);
  };
  return { Module, original };
}

function restoreRequireShim(Module, original) {
  if (Module && original) {
    Module.prototype.require = original;
  }
  delete require.cache[require.resolve('../controllers/user')];
}

// ---------------------------------------------------------------------------
// Helper factory to build a fake user document used by many test suites.
// ---------------------------------------------------------------------------
function makeFakeUser(overrides = {}) {
  return Object.assign(
    {
      id: 'user-id-123',
      email: 'test@example.com',
      password: 'hashedpassword',
      emailVerified: true,
      twoFactorEnabled: false,
      twoFactorMethods: [],
      twoFactorCode: undefined,
      twoFactorExpires: undefined,
      twoFactorIpHash: undefined,
      tokens: [],
      profile: { pictures: new Map(), picture: undefined, pictureSource: undefined },
      save: sinon.stub().resolves(),
      clearTwoFactorCode: sinon.spy(),
    },
    overrides,
  );
}

describe('User Controller', () => {
  describe('qr package API contract', () => {
    it('should export a callable default function', () => {
      const encodeQR = require('qr').default;
      expect(encodeQR).to.be.a('function');
    });

    it('should generate a non-empty SVG string for a TOTP URI', () => {
      const encodeQR = require('qr').default;
      const totpUri = 'otpauth://totp/Hackathon%20Starter:test%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Hackathon%20Starter&algorithm=SHA1&digits=6&period=30';
      const svg = encodeQR(totpUri, 'svg');
      expect(svg).to.be.a('string').and.to.have.length.above(0);
      expect(svg.trimStart()).to.match(/^<svg/i);
      expect(svg).to.include('</svg>');
    });
  });

  describe('getTotpSetup', () => {
    let userFindByIdStub;
    let userSaveStub;
    let userController;
    let shimModule;
    let shimOriginal;
    let req;
    let res;
    let next;

    beforeEach(() => {
      userSaveStub = sinon.stub().resolves();

      const fakeUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: true,
        save: userSaveStub,
      };
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123' },
        session: {},
        flash: sinon.spy(),
      };
      res = { render: sinon.spy(), redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should render totp-setup with a valid SVG data URI as qrImage', async () => {
      await userController.getTotpSetup(req, res, next);

      expect(next.called, 'next() should not be called on success').to.be.false;
      expect(res.render.calledOnce, 'render should be called once').to.be.true;
      expect(res.render.firstCall.args[0]).to.equal('account/totp-setup');

      const renderArgs = res.render.firstCall.args[1];
      expect(renderArgs).to.have.property('qrImage');
      expect(renderArgs).to.have.property('secret');
      expect(renderArgs.qrImage).to.be.a('string');
      expect(renderArgs.qrImage).to.match(/^data:image\/svg\+xml;utf8,/);

      // Decode and verify the embedded SVG is well-formed
      const svgContent = decodeURIComponent(renderArgs.qrImage.replace('data:image/svg+xml;utf8,', ''));
      expect(svgContent.trimStart()).to.match(/^<svg/i);
      expect(svgContent).to.include('</svg>');
    });

    it('should store the TOTP secret in the session', async () => {
      await userController.getTotpSetup(req, res, next);

      expect(req.session.totpSecret).to.be.a('string').and.to.have.length.above(0);
    });

    it('should redirect to /account if user has no password', async () => {
      userFindByIdStub.resolves({
        id: 'user-id-123',
        email: 'test@example.com',
        password: undefined,
        emailVerified: true,
      });

      await userController.getTotpSetup(req, res, next);

      expect(res.redirect.calledWith('/account')).to.be.true;
      expect(res.render.called).to.be.false;
    });

    it('should redirect to /account if email is not verified', async () => {
      userFindByIdStub.resolves({
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: false,
      });

      await userController.getTotpSetup(req, res, next);

      expect(res.redirect.calledWith('/account')).to.be.true;
      expect(res.render.called).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  // Shared beforeEach / afterEach factory used by all suites below.
  // Each suite provides its own `overrides` object so we don't need to
  // duplicate the shim boilerplate.
  // -------------------------------------------------------------------------

  // =========================================================================
  // postLogin
  // =========================================================================
  describe('postLogin', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindOneStub;
    let userGenerateTokenStub;
    let userHashIPStub;
    let nodemailerSendMailStub;
    let passportAuthenticateStub;
    let req;
    let res;
    let next;

    beforeEach(() => {
      userFindOneStub = sinon.stub();
      userGenerateTokenStub = sinon.stub().resolves('hex-token-abc');
      userHashIPStub = sinon.stub().returns('hashed-ip');
      nodemailerSendMailStub = sinon.stub().resolves();

      // controllers/user imports passport at module load time; our require shim
      // ensures the controller sees this stubbed passport.authenticate function
      passportAuthenticateStub = sinon.stub();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': {
          findOne: userFindOneStub,
          generateToken: userGenerateTokenStub,
          hashIP: userHashIPStub,
        },
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
        passport: { authenticate: passportAuthenticateStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        body: { email: 'user@example.com', password: '' },
        ip: '127.0.0.1',
        session: {},
        flash: sinon.spy(),
        logIn: sinon.stub().callsFake((_user, cb) => cb(null)),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error and redirect /login for invalid email', async () => {
      req.body.email = 'not-an-email';
      await userController.postLogin(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should flash error and redirect /login when password is blank', async () => {
      req.body.email = 'user@example.com';
      req.body.password = '';
      await userController.postLogin(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should send email link and redirect /login for email-link login when user exists', async () => {
      const fakeUser = makeFakeUser({ save: sinon.stub().resolves() });
      userFindOneStub.resolves(fakeUser);
      nodemailerSendMailStub.resolves();

      req.body.email = 'user@example.com';
      req.body.loginByEmailLink = 'on';
      req.body.password = '';

      await userController.postLogin(req, res, next);

      expect(userFindOneStub.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should redirect /login with generic info flash when email-link user not found (anti-enumeration)', async () => {
      userFindOneStub.resolves(null);

      req.body.email = 'nobody@example.com';
      req.body.loginByEmailLink = 'on';
      req.body.password = '';

      await userController.postLogin(req, res, next);

      expect(req.flash.calledWith('info')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
      expect(nodemailerSendMailStub.called).to.be.false;
    });

    it('should redirect to /login/2fa/totp when user has totp method enabled', async () => {
      const fakeUser = makeFakeUser({ twoFactorEnabled: true, twoFactorMethods: ['totp'], password: 'pass' });
      // passport.authenticate is called as passport.authenticate('local', cb)(req,res,next)
      // We simulate this by making authenticate return a function that invokes callback
      passportAuthenticateStub.callsFake((_strategy, cb) => () => cb(null, fakeUser, null));

      req.body.email = 'user@example.com';
      req.body.password = 'somepass';

      await userController.postLogin(req, res, next);

      expect(req.session.twoFactorPendingUserId).to.equal(fakeUser.id);
      expect(res.redirect.calledWith('/login/2fa/totp')).to.be.true;
    });

    it('should redirect to /login/2fa when user has email 2FA enabled', async () => {
      const fakeUser = makeFakeUser({ twoFactorEnabled: true, twoFactorMethods: ['email'], password: 'pass' });
      passportAuthenticateStub.callsFake((_strategy, cb) => () => cb(null, fakeUser, null));

      req.body.email = 'user@example.com';
      req.body.password = 'somepass';

      await userController.postLogin(req, res, next);

      expect(req.session.twoFactorPendingUserId).to.equal(fakeUser.id);
      expect(res.redirect.calledWith('/login/2fa')).to.be.true;
    });

    it('should log in and redirect to / when passport authentication succeeds without 2FA', async () => {
      const fakeUser = makeFakeUser({ twoFactorEnabled: false });
      passportAuthenticateStub.callsFake((_strategy, cb) => () => cb(null, fakeUser, null));

      req.body.email = 'user@example.com';
      req.body.password = 'somepass';

      await userController.postLogin(req, res, next);

      expect(req.logIn.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/')).to.be.true;
    });

    it('should flash errors and redirect /login when passport returns no user', async () => {
      passportAuthenticateStub.callsFake((_strategy, cb) => () => cb(null, false, { msg: 'Invalid' }));

      req.body.email = 'user@example.com';
      req.body.password = 'wrongpass';

      await userController.postLogin(req, res, next);

      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });
  });

  // =========================================================================
  // postSignup
  // =========================================================================
  describe('postSignup', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindOneStub;
    let userGenerateTokenStub;
    let userHashIPStub;
    let nodemailerSendMailStub;
    let fakeUserInstance;
    let req;
    let res;
    let next;

    beforeEach(() => {
      userFindOneStub = sinon.stub();
      userGenerateTokenStub = sinon.stub().resolves('token123');
      userHashIPStub = sinon.stub().returns('hashed-ip');
      nodemailerSendMailStub = sinon.stub().resolves();

      fakeUserInstance = {
        email: '',
        password: '',
        save: sinon.stub().resolves(),
      };

      // We need to fake the User constructor
      function FakeUser(data) {
        Object.assign(this, data);
        this.save = fakeUserInstance.save;
      }
      FakeUser.findOne = userFindOneStub;
      FakeUser.generateToken = userGenerateTokenStub;
      FakeUser.hashIP = userHashIPStub;

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': FakeUser,
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        body: { email: 'new@example.com', password: 'Password1', confirmPassword: 'Password1' },
        ip: '127.0.0.1',
        flash: sinon.spy(),
        session: {},
        logIn: sinon.stub().callsFake((_user, cb) => cb(null)),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error and redirect /signup for invalid email', async () => {
      req.body.email = 'bad-email';
      await userController.postSignup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/signup')).to.be.true;
    });

    it('should flash error and redirect /signup when password is too short', async () => {
      req.body.password = 'short';
      req.body.confirmPassword = 'short';
      await userController.postSignup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/signup')).to.be.true;
    });

    it('should flash error and redirect /signup when passwords do not match', async () => {
      req.body.password = 'Password1';
      req.body.confirmPassword = 'Password2';
      await userController.postSignup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/signup')).to.be.true;
    });

    it('should flash error for disposable email addresses', async () => {
      req.body.email = 'user@mailinator.com';
      await userController.postSignup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/signup')).to.be.true;
    });

    it('should send login link and redirect /login when email already exists (anti-enumeration)', async () => {
      const existingUser = makeFakeUser({ loginToken: undefined, loginExpires: undefined, loginIpHash: undefined });
      userFindOneStub.resolves(existingUser);

      await userController.postSignup(req, res, next);

      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should create user, send passwordless link, and redirect / for passwordless signup', async () => {
      userFindOneStub.resolves(null);
      req.body.passwordless = 'on';
      delete req.body.password;
      delete req.body.confirmPassword;

      await userController.postSignup(req, res, next);

      expect(fakeUserInstance.save.called).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/')).to.be.true;
    });

    it('should create user and log in for regular signup', async () => {
      userFindOneStub.resolves(null);

      await userController.postSignup(req, res, next);

      expect(fakeUserInstance.save.called).to.be.true;
      expect(req.logIn.calledOnce).to.be.true;
    });
  });

  // =========================================================================
  // postUpdateProfile
  // =========================================================================
  describe('postUpdateProfile', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        email: 'test@example.com',
        twoFactorEnabled: false,
        twoFactorMethods: [],
        profile: { name: '', gender: '', location: '', website: '', picture: undefined, pictureSource: undefined, pictures: new Map() },
      });

      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123' },
        body: { email: 'test@example.com', name: 'Test User', gender: 'male', location: 'NYC', website: 'https://example.com' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error and redirect /account for invalid email', async () => {
      req.body.email = 'not-valid';
      await userController.postUpdateProfile(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should block email change when email 2FA is the only method', async () => {
      fakeUser.twoFactorEnabled = true;
      fakeUser.twoFactorMethods = ['email'];
      req.body.email = 'newemail@example.com';

      await userController.postUpdateProfile(req, res, next);

      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
      expect(fakeUser.save.called).to.be.false;
    });

    it('should allow email change when TOTP is also enabled alongside email 2FA', async () => {
      fakeUser.twoFactorEnabled = true;
      fakeUser.twoFactorMethods = ['email', 'totp'];
      req.body.email = 'newemail@example.com';

      await userController.postUpdateProfile(req, res, next);

      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should update profile fields successfully', async () => {
      await userController.postUpdateProfile(req, res, next);

      expect(fakeUser.profile.name).to.equal('Test User');
      expect(fakeUser.profile.gender).to.equal('male');
      expect(fakeUser.profile.location).to.equal('NYC');
      expect(fakeUser.profile.website).to.equal('https://example.com');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });

    it('should reject invalid picture source', async () => {
      req.body.pictureSource = 'nonexistent-provider';

      await userController.postUpdateProfile(req, res, next);

      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
      expect(fakeUser.save.called).to.be.false;
    });

    it('should update picture source when valid source provided', async () => {
      fakeUser.profile.pictures = new Map([['gravatar', 'https://gravatar.com/pic']]);
      req.body.pictureSource = 'gravatar';

      await userController.postUpdateProfile(req, res, next);

      expect(fakeUser.profile.pictureSource).to.equal('gravatar');
      expect(fakeUser.profile.picture).to.equal('https://gravatar.com/pic');
      expect(fakeUser.save.calledOnce).to.be.true;
    });

    it('should flash generic error on duplicate email (err.code 11000)', async () => {
      const dupError = new Error('Duplicate');
      dupError.code = 11000;
      fakeUser.save.rejects(dupError);
      req.body.email = 'duplicate@example.com';

      await userController.postUpdateProfile(req, res, next);

      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
      // next() should NOT be called — error is handled
      expect(next.called).to.be.false;
    });
  });

  // =========================================================================
  // postUpdatePassword
  // =========================================================================
  describe('postUpdatePassword', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser();
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123' },
        body: { password: 'NewPassword1', confirmPassword: 'NewPassword1' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error when password is too short', async () => {
      req.body.password = 'short';
      req.body.confirmPassword = 'short';
      await userController.postUpdatePassword(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should flash error when passwords do not match', async () => {
      req.body.confirmPassword = 'DifferentPass1';
      await userController.postUpdatePassword(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should save new password and redirect /account on success', async () => {
      await userController.postUpdatePassword(req, res, next);

      expect(fakeUser.password).to.equal('NewPassword1');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });
  });

  // =========================================================================
  // postDeleteAccount
  // =========================================================================
  describe('postDeleteAccount', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userDeleteOneStub;
    let revokeAllProviderTokensStub;
    let deleteUserAIAgentDataStub;
    let req;
    let res;
    let next;

    beforeEach(() => {
      userDeleteOneStub = sinon.stub().resolves();
      revokeAllProviderTokensStub = sinon.stub().resolves();
      deleteUserAIAgentDataStub = sinon.stub().resolves();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { deleteOne: userDeleteOneStub },
        '../config/token-revocation': { revokeAllProviderTokens: revokeAllProviderTokensStub, revokeProviderTokens: sinon.stub().resolves() },
        './ai-agent': { deleteUserAIAgentData: deleteUserAIAgentDataStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123', tokens: [] },
        flash: sinon.spy(),
        logout: sinon.stub().callsFake((cb) => cb(null)),
        session: { destroy: sinon.stub().callsFake((cb) => cb(null)) },
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should revoke tokens, delete AI data, delete user, and redirect /', async () => {
      await userController.postDeleteAccount(req, res, next);

      expect(revokeAllProviderTokensStub.calledOnce).to.be.true;
      expect(deleteUserAIAgentDataStub.calledOnce).to.be.true;
      expect(userDeleteOneStub.calledOnce).to.be.true;
      expect(req.logout.calledOnce).to.be.true;
      expect(req.session.destroy.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/')).to.be.true;
    });

    it('should call next(err) if an unexpected error occurs', async () => {
      const err = new Error('db error');
      userDeleteOneStub.rejects(err);
      await userController.postDeleteAccount(req, res, next);
      expect(next.calledWith(err)).to.be.true;
    });
  });

  // =========================================================================
  // getOauthUnlink
  // =========================================================================
  describe('getOauthUnlink', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let revokeProviderTokensStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        google: 'google-id',
        tokens: [{ kind: 'google', accessToken: 'google-token' }],
        profile: {
          pictures: new Map([
            ['gravatar', 'https://gravatar.com/pic'],
            ['google', 'https://google.com/pic'],
          ]),
          picture: 'https://google.com/pic',
          pictureSource: 'google',
        },
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);
      revokeProviderTokensStub = sinon.stub().resolves();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
        '../config/token-revocation': { revokeProviderTokens: revokeProviderTokensStub, revokeAllProviderTokens: sinon.stub().resolves() },
        './ai-agent': { deleteUserAIAgentData: sinon.stub().resolves() },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123' },
        params: { provider: 'google' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should unlink provider, revoke token, and redirect /account', async () => {
      await userController.getOauthUnlink(req, res, next);

      expect(fakeUser.google).to.be.undefined;
      expect(fakeUser.tokens).to.have.lengthOf(0);
      expect(revokeProviderTokensStub.calledOnce).to.be.true;
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('info')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should block unlink when it would remove the last login method', async () => {
      fakeUser.email = undefined;
      fakeUser.password = undefined;
      // only token is the google one, no other login after unlink

      await userController.getOauthUnlink(req, res, next);

      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
      expect(fakeUser.save.called).to.be.false;
    });

    it('should fall back to gravatar picture when unlinked provider was active picture source', async () => {
      await userController.getOauthUnlink(req, res, next);

      // google was pictureSource; gravatar should be chosen as fallback
      expect(fakeUser.profile.pictureSource).to.equal('gravatar');
      expect(fakeUser.profile.picture).to.equal('https://gravatar.com/pic');
    });

    it('should clear picture source when no fallback picture exists', async () => {
      fakeUser.profile.pictures = new Map([['google', 'https://google.com/pic']]);
      fakeUser.profile.pictureSource = 'google';

      await userController.getOauthUnlink(req, res, next);

      expect(fakeUser.profile.pictureSource).to.be.undefined;
      expect(fakeUser.profile.picture).to.be.undefined;
    });
  });

  // =========================================================================
  // getLoginByEmail
  // =========================================================================
  describe('getLoginByEmail', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindOneStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        loginToken: 'validhex',
        loginExpires: Date.now() + 900000,
        loginIpHash: 'hashed-ip',
        verifyTokenAndIp: sinon.stub().returns(true),
      });
      userFindOneStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findOne: userFindOneStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: null,
        params: { token: 'a'.repeat(64) }, // valid hex-like token (64 hex chars)
        ip: '127.0.0.1',
        session: { returnTo: undefined },
        flash: sinon.spy(),
        logIn: sinon.stub().callsFake((_user, cb) => cb(null)),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error and redirect /login for non-hex token', async () => {
      req.params.token = 'not-hex!';
      await userController.getLoginByEmail(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should flash error and redirect /login when token not found or invalid', async () => {
      fakeUser.verifyTokenAndIp.returns(false);
      await userController.getLoginByEmail(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should mark emailVerified, log in, and redirect on success', async () => {
      await userController.getLoginByEmail(req, res, next);

      expect(fakeUser.emailVerified).to.be.true;
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.logIn.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });

    it('should redirect to returnTo URL if set in session', async () => {
      req.session.returnTo = '/dashboard';
      await userController.getLoginByEmail(req, res, next);
      expect(res.redirect.calledWith('/dashboard')).to.be.true;
    });

    it('should redirect to / if already authenticated', async () => {
      req.user = { id: 'already-logged-in' };
      await userController.getLoginByEmail(req, res, next);
      expect(res.redirect.calledWith('/')).to.be.true;
    });
  });

  // =========================================================================
  // getReset / postReset
  // =========================================================================
  describe('getReset', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindOneStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        passwordResetToken: 'a'.repeat(64),
        verifyTokenAndIp: sinon.stub().returns(true),
      });
      userFindOneStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findOne: userFindOneStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        params: { token: 'a'.repeat(64) },
        ip: '127.0.0.1',
        flash: sinon.spy(),
        isAuthenticated: sinon.stub().returns(false),
      };
      res = { redirect: sinon.spy(), render: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should redirect / when user is already authenticated', async () => {
      req.isAuthenticated.returns(true);
      await userController.getReset(req, res, next);
      expect(res.redirect.calledWith('/')).to.be.true;
    });

    it('should flash error and redirect /forgot for non-hex token', async () => {
      req.params.token = 'not!hex';
      await userController.getReset(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/forgot')).to.be.true;
    });

    it('should flash error and redirect /forgot when token is invalid', async () => {
      fakeUser.verifyTokenAndIp.returns(false);
      await userController.getReset(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/forgot')).to.be.true;
    });

    it('should render reset page for valid token', async () => {
      await userController.getReset(req, res, next);
      expect(res.render.calledWith('account/reset')).to.be.true;
    });
  });

  describe('postReset', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindOneStub;
    let nodemailerSendMailStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        passwordResetToken: 'a'.repeat(64),
        verifyTokenAndIp: sinon.stub().returns(true),
      });
      userFindOneStub = sinon.stub().resolves(fakeUser);
      nodemailerSendMailStub = sinon.stub().resolves();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findOne: userFindOneStub },
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        params: { token: 'a'.repeat(64) },
        body: { password: 'NewPassword1', confirm: 'NewPassword1' },
        ip: '127.0.0.1',
        flash: sinon.spy(),
        get: sinon.stub().returns(undefined),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error when password is too short', async () => {
      req.body.password = 'short';
      req.body.confirm = 'short';
      await userController.postReset(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
    });

    it('should flash error when passwords do not match', async () => {
      req.body.confirm = 'WrongPassword1';
      await userController.postReset(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
    });

    it('should flash error for non-hex token', async () => {
      req.params.token = 'not!hex';
      await userController.postReset(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
    });

    it('should flash error when token is invalid or expired', async () => {
      fakeUser.verifyTokenAndIp.returns(false);
      fakeUser.get = sinon.stub().returns(undefined);
      await userController.postReset(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should update password, set emailVerified, send email, and redirect / on success', async () => {
      await userController.postReset(req, res, next);

      expect(fakeUser.password).to.equal('NewPassword1');
      expect(fakeUser.emailVerified).to.be.true;
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/')).to.be.true;
    });
  });

  // =========================================================================
  // postForgot
  // =========================================================================
  describe('postForgot', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindOneStub;
    let userGenerateTokenStub;
    let userHashIPStub;
    let nodemailerSendMailStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser();
      userFindOneStub = sinon.stub();
      userGenerateTokenStub = sinon.stub().resolves('reset-token-abc');
      userHashIPStub = sinon.stub().returns('hashed-ip');
      nodemailerSendMailStub = sinon.stub().resolves();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': {
          findOne: userFindOneStub,
          generateToken: userGenerateTokenStub,
          hashIP: userHashIPStub,
        },
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        body: { email: 'test@example.com' },
        ip: '127.0.0.1',
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error for invalid email', async () => {
      req.body.email = 'invalid-email';
      await userController.postForgot(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/forgot')).to.be.true;
    });

    it('should show generic message and not send email when user not found (anti-enumeration)', async () => {
      userFindOneStub.resolves(null);
      await userController.postForgot(req, res, next);
      expect(req.flash.calledWith('info')).to.be.true;
      expect(nodemailerSendMailStub.called).to.be.false;
      expect(res.redirect.calledWith('/forgot')).to.be.true;
    });

    it('should generate token, save user, and send reset email for known user', async () => {
      userFindOneStub.resolves(fakeUser);
      await userController.postForgot(req, res, next);
      expect(fakeUser.passwordResetToken).to.equal('reset-token-abc');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/forgot')).to.be.true;
    });
  });

  // =========================================================================
  // postLogoutEverywhere
  // =========================================================================
  describe('postLogoutEverywhere', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let removeSessionStub;
    let req;
    let res;
    let next;

    beforeEach(() => {
      removeSessionStub = sinon.stub().resolves();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/Session': { removeSessionByUserId: removeSessionStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123' },
        flash: sinon.spy(),
        logout: sinon.stub().callsFake((cb) => cb(null)),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should remove all sessions, logout, and redirect /', async () => {
      await userController.postLogoutEverywhere(req, res, next);

      expect(removeSessionStub.calledWith('user-id-123')).to.be.true;
      expect(req.logout.calledOnce).to.be.true;
      expect(req.flash.calledWith('info')).to.be.true;
      expect(res.redirect.calledWith('/')).to.be.true;
    });

    it('should call next(err) when session removal fails', async () => {
      const err = new Error('session error');
      removeSessionStub.rejects(err);
      await userController.postLogoutEverywhere(req, res, next);
      expect(next.calledWith(err)).to.be.true;
    });
  });

  // =========================================================================
  // Email 2FA flows: getTwoFactor, postTwoFactor, resendTwoFactorCode
  // =========================================================================
  describe('getTwoFactor', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let nodemailerSendMailStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        twoFactorEnabled: true,
        twoFactorMethods: ['email'],
        twoFactorCode: undefined,
        twoFactorExpires: undefined,
        twoFactorIpHash: undefined,
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);
      nodemailerSendMailStub = sinon.stub().resolves();

      const FakeUser = { findById: userFindByIdStub, hashIP: sinon.stub().returns('hashed-ip'), generateCode: sinon.stub().returns('123456') };

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': FakeUser,
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        ip: '127.0.0.1',
        session: { twoFactorPendingUserId: 'user-id-123' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy(), render: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should redirect /login when no twoFactorPendingUserId in session', async () => {
      req.session.twoFactorPendingUserId = undefined;
      await userController.getTwoFactor(req, res, next);
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should generate new code when no valid code exists, send email, and render page', async () => {
      await userController.getTwoFactor(req, res, next);

      expect(fakeUser.twoFactorCode).to.equal('123456');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.render.calledWith('account/two-factor')).to.be.true;
    });

    it('should reuse existing valid code without sending another email', async () => {
      fakeUser.twoFactorCode = '654321';
      fakeUser.twoFactorExpires = Date.now() + 600000;
      fakeUser.twoFactorIpHash = 'hashed-ip';

      await userController.getTwoFactor(req, res, next);

      expect(fakeUser.save.called).to.be.false;
      expect(nodemailerSendMailStub.called).to.be.false;
      expect(res.render.calledWith('account/two-factor')).to.be.true;
    });

    it('should redirect to /login/2fa/totp if user does not have email in twoFactorMethods', async () => {
      fakeUser.twoFactorMethods = ['totp'];
      await userController.getTwoFactor(req, res, next);
      expect(res.redirect.calledWith('/login/2fa/totp')).to.be.true;
    });
  });

  describe('postTwoFactor', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        twoFactorEnabled: true,
        twoFactorMethods: ['email'],
        verifyCodeAndIp: sinon.stub().returns(true),
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        body: { code: '123456' },
        ip: '127.0.0.1',
        session: { twoFactorPendingUserId: 'user-id-123', returnTo: undefined },
        flash: sinon.spy(),
        logIn: sinon.stub().callsFake((_user, cb) => cb(null)),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error and redirect /login/2fa for non-numeric code', async () => {
      req.body.code = 'abc123';
      await userController.postTwoFactor(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login/2fa')).to.be.true;
    });

    it('should flash error and redirect /login/2fa for code that is not 6 digits', async () => {
      req.body.code = '123';
      await userController.postTwoFactor(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login/2fa')).to.be.true;
    });

    it('should flash error and redirect /login when session expired', async () => {
      req.session.twoFactorPendingUserId = undefined;
      req.body.code = '123456';
      await userController.postTwoFactor(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should flash error and redirect /login/2fa for invalid code', async () => {
      fakeUser.verifyCodeAndIp.returns(false);
      await userController.postTwoFactor(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login/2fa')).to.be.true;
    });

    it('should clear code, log in, and redirect to / on valid code', async () => {
      await userController.postTwoFactor(req, res, next);

      expect(fakeUser.clearTwoFactorCode.calledOnce).to.be.true;
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.session.twoFactorPendingUserId).to.be.undefined;
      expect(req.logIn.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });
  });

  describe('resendTwoFactorCode', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let nodemailerSendMailStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        twoFactorEnabled: true,
        twoFactorMethods: ['email'],
        twoFactorCode: undefined,
        twoFactorExpires: undefined,
        twoFactorIpHash: undefined,
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);
      nodemailerSendMailStub = sinon.stub().resolves();

      const FakeUser = { findById: userFindByIdStub, hashIP: sinon.stub().returns('hashed-ip'), generateCode: sinon.stub().returns('999888') };

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': FakeUser,
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        ip: '127.0.0.1',
        session: { twoFactorPendingUserId: 'user-id-123' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error and redirect /login when session has no pending user', async () => {
      req.session.twoFactorPendingUserId = undefined;
      await userController.resendTwoFactorCode(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should generate new code when no valid code exists and send email', async () => {
      await userController.resendTwoFactorCode(req, res, next);

      expect(fakeUser.twoFactorCode).to.equal('999888');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/login/2fa')).to.be.true;
    });

    it('should reuse existing valid code and resend it with appropriate message', async () => {
      fakeUser.twoFactorCode = '777666';
      fakeUser.twoFactorExpires = Date.now() + 600000;
      fakeUser.twoFactorIpHash = 'hashed-ip';

      await userController.resendTwoFactorCode(req, res, next);

      // Code should be unchanged (reused)
      expect(fakeUser.twoFactorCode).to.equal('777666');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/login/2fa')).to.be.true;
    });

    it('should redirect to /login/2fa/totp if email 2FA not in user methods', async () => {
      fakeUser.twoFactorMethods = ['totp'];
      await userController.resendTwoFactorCode(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login/2fa/totp')).to.be.true;
    });
  });

  // =========================================================================
  // postEnable2FA
  // =========================================================================
  describe('postEnable2FA', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        password: 'hashedpassword',
        emailVerified: true,
        twoFactorEnabled: false,
        twoFactorMethods: [],
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: { id: 'user-id-123' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash error when user has no password', async () => {
      fakeUser.password = undefined;
      await userController.postEnable2FA(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should flash error when email is not verified', async () => {
      fakeUser.emailVerified = false;
      await userController.postEnable2FA(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should enable 2FA and add email method on success', async () => {
      await userController.postEnable2FA(req, res, next);

      expect(fakeUser.twoFactorEnabled).to.be.true;
      expect(fakeUser.twoFactorMethods).to.include('email');
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });

    it('should not add duplicate email method if already present', async () => {
      fakeUser.twoFactorMethods = ['email'];
      await userController.postEnable2FA(req, res, next);
      expect(fakeUser.twoFactorMethods.filter((m) => m === 'email')).to.have.lengthOf(1);
    });
  });

  // =========================================================================
  // postRemoveTotp / postRemoveEmail2FA
  // =========================================================================
  describe('postRemoveTotp', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        totpSecret: 'SECRET',
        twoFactorEnabled: true,
        twoFactorMethods: ['totp', 'email'],
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = { user: { id: 'user-id-123' }, flash: sinon.spy() };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should remove totpSecret and totp from methods', async () => {
      await userController.postRemoveTotp(req, res, next);

      expect(fakeUser.totpSecret).to.be.undefined;
      expect(fakeUser.twoFactorMethods).to.not.include('totp');
      expect(fakeUser.twoFactorEnabled).to.be.true; // email remains
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });

    it('should disable 2FA entirely when totp was the only method', async () => {
      fakeUser.twoFactorMethods = ['totp'];
      await userController.postRemoveTotp(req, res, next);

      expect(fakeUser.twoFactorEnabled).to.be.false;
    });
  });

  describe('postRemoveEmail2FA', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        twoFactorEnabled: true,
        twoFactorMethods: ['email', 'totp'],
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = { user: { id: 'user-id-123' }, flash: sinon.spy() };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should remove email from twoFactorMethods and call clearTwoFactorCode', async () => {
      await userController.postRemoveEmail2FA(req, res, next);

      expect(fakeUser.twoFactorMethods).to.not.include('email');
      expect(fakeUser.clearTwoFactorCode.calledOnce).to.be.true;
      expect(fakeUser.twoFactorEnabled).to.be.true; // totp still present
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });

    it('should disable 2FA entirely when email was the only method', async () => {
      fakeUser.twoFactorMethods = ['email'];
      await userController.postRemoveEmail2FA(req, res, next);
      expect(fakeUser.twoFactorEnabled).to.be.false;
    });
  });

  // =========================================================================
  // postTotpSetup
  // =========================================================================
  describe('postTotpSetup', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      // Freeze time at a fixed timestamp so totp.generate() and the controller's
      // totp.validate() always operate on the same 30-second TOTP window,
      // eliminating flakiness when the test runs near a step boundary.
      sinon.useFakeTimers({ now: 1_000_000_000_000 });

      fakeUser = makeFakeUser({
        twoFactorEnabled: false,
        twoFactorMethods: [],
        totpSecret: undefined,
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      const OTPAuth = require('otpauth');
      const secret = OTPAuth.Secret.fromBase32('JBSWY3DPEHPK3PXP');
      const totp = new OTPAuth.TOTP({ secret });
      const validCode = totp.generate();

      req = {
        user: { id: 'user-id-123' },
        body: { code: validCode },
        session: { totpSecret: 'JBSWY3DPEHPK3PXP' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore(); // also restores fake timers
    });

    it('should flash error when code is not 6 numeric digits', async () => {
      req.body.code = 'abc';
      await userController.postTotpSetup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account/2fa/totp/setup')).to.be.true;
    });

    it('should flash error and redirect /account when session totpSecret is missing', async () => {
      req.session.totpSecret = undefined;
      req.body.code = '123456';
      await userController.postTotpSetup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should flash error and redirect /account/2fa/totp/setup for invalid TOTP code', async () => {
      req.body.code = '000000';
      await userController.postTotpSetup(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account/2fa/totp/setup')).to.be.true;
    });

    it('should enable TOTP and redirect /account on valid code', async () => {
      await userController.postTotpSetup(req, res, next);

      expect(fakeUser.twoFactorEnabled).to.be.true;
      expect(fakeUser.totpSecret).to.equal('JBSWY3DPEHPK3PXP');
      expect(fakeUser.twoFactorMethods).to.include('totp');
      expect(req.session.totpSecret).to.be.undefined;
      expect(fakeUser.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });
  });

  // =========================================================================
  // getTotpVerify / postTotpVerify
  // =========================================================================
  describe('getTotpVerify', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      fakeUser = makeFakeUser({
        totpSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorMethods: ['totp'],
      });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        session: { twoFactorPendingUserId: 'user-id-123' },
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy(), render: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should redirect /login when no pending 2FA session', async () => {
      req.session.twoFactorPendingUserId = undefined;
      await userController.getTotpVerify(req, res, next);
      expect(res.redirect.calledWith('/login')).to.be.true;
    });

    it('should render two-factor page when TOTP is configured', async () => {
      await userController.getTotpVerify(req, res, next);
      expect(res.render.calledWith('account/two-factor')).to.be.true;
      const args = res.render.firstCall.args[1];
      expect(args.method).to.equal('totp');
    });

    it('should flash error and redirect /login when user has no totpSecret', async () => {
      fakeUser.totpSecret = undefined;
      await userController.getTotpVerify(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login')).to.be.true;
    });
  });

  describe('postTotpVerify', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userFindByIdStub;
    let fakeUser;
    let req;
    let res;
    let next;

    beforeEach(() => {
      // Freeze time at a fixed timestamp so totp.generate() and the controller's
      // totp.validate() always operate on the same 30-second TOTP window,
      // eliminating flakiness when the test runs near a step boundary.
      sinon.useFakeTimers({ now: 1_000_000_000_000 });

      fakeUser = makeFakeUser({ totpSecret: 'JBSWY3DPEHPK3PXP' });
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { findById: userFindByIdStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      const OTPAuth = require('otpauth');
      const secret = OTPAuth.Secret.fromBase32('JBSWY3DPEHPK3PXP');
      const totp = new OTPAuth.TOTP({ secret });
      const validCode = totp.generate();

      req = {
        body: { code: validCode },
        ip: '127.0.0.1',
        session: { twoFactorPendingUserId: 'user-id-123', returnTo: undefined },
        flash: sinon.spy(),
        logIn: sinon.stub().callsFake((_user, cb) => cb(null)),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore(); // also restores fake timers
    });

    it('should flash error and redirect /login/2fa/totp for non-numeric code', async () => {
      req.body.code = 'abcdef';
      await userController.postTotpVerify(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login/2fa/totp')).to.be.true;
    });

    it('should flash error for invalid TOTP code', async () => {
      req.body.code = '000000';
      await userController.postTotpVerify(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/login/2fa/totp')).to.be.true;
    });

    it('should log in and redirect / on valid TOTP code', async () => {
      await userController.postTotpVerify(req, res, next);

      expect(req.session.twoFactorPendingUserId).to.be.undefined;
      expect(req.logIn.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
    });
  });

  // =========================================================================
  // getVerifyEmail / getVerifyEmailToken
  // =========================================================================
  describe('getVerifyEmail', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let userGenerateTokenStub;
    let userHashIPStub;
    let nodemailerSendMailStub;
    let req;
    let res;
    let next;

    beforeEach(() => {
      userGenerateTokenStub = sinon.stub().resolves('verify-token');
      userHashIPStub = sinon.stub().returns('hashed-ip');
      nodemailerSendMailStub = sinon.stub().resolves();

      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({
        '../models/User': { generateToken: userGenerateTokenStub, hashIP: userHashIPStub },
        '../config/nodemailer': { sendMail: nodemailerSendMailStub },
      }));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: {
          email: 'test@example.com',
          emailVerified: false,
          save: sinon.stub().resolves(),
        },
        ip: '127.0.0.1',
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash info and redirect /account if already verified', async () => {
      req.user.emailVerified = true;
      await userController.getVerifyEmail(req, res, next);
      expect(req.flash.calledWith('info')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should flash error for disposable email', async () => {
      req.user.email = 'user@mailinator.com';
      await userController.getVerifyEmail(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should generate token, save user, and send verification email', async () => {
      await userController.getVerifyEmail(req, res, next);

      expect(req.user.emailVerificationToken).to.equal('verify-token');
      expect(req.user.save.calledOnce).to.be.true;
      expect(nodemailerSendMailStub.calledOnce).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });
  });

  describe('getVerifyEmailToken', () => {
    let userController;
    let shimModule;
    let shimOriginal;
    let req;
    let res;
    let next;

    beforeEach(() => {
      ({ Module: shimModule, original: shimOriginal } = buildRequireShim({}));

      delete require.cache[require.resolve('../controllers/user')];
      userController = require('../controllers/user');

      req = {
        user: {
          emailVerified: false,
          emailVerificationToken: 'a'.repeat(64),
          verifyTokenAndIp: sinon.stub().returns(true),
          save: sinon.stub().resolves(),
        },
        params: { token: 'a'.repeat(64) },
        ip: '127.0.0.1',
        flash: sinon.spy(),
      };
      res = { redirect: sinon.spy() };
      next = sinon.spy();
    });

    afterEach(() => {
      restoreRequireShim(shimModule, shimOriginal);
      sinon.restore();
    });

    it('should flash info and redirect /account if already verified', async () => {
      req.user.emailVerified = true;
      await userController.getVerifyEmailToken(req, res, next);
      expect(req.flash.calledWith('info')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should flash error for invalid token format', async () => {
      req.params.token = 'not!valid!hex';
      await userController.getVerifyEmailToken(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should flash error when token does not match', async () => {
      req.user.verifyTokenAndIp.returns(false);
      await userController.getVerifyEmailToken(req, res, next);
      expect(req.flash.calledWith('errors')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });

    it('should set emailVerified, save, and redirect /account on valid token', async () => {
      await userController.getVerifyEmailToken(req, res, next);

      expect(req.user.emailVerified).to.be.true;
      expect(req.user.save.calledOnce).to.be.true;
      expect(req.flash.calledWith('success')).to.be.true;
      expect(res.redirect.calledWith('/account')).to.be.true;
    });
  });
});
