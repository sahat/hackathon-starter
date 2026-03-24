/* eslint-disable global-require */
const crypto = require('node:crypto');
const path = require('node:path');
const { expect } = require('chai');
const sinon = require('sinon');

process.loadEnvFile(path.join(__dirname, '.env.test'));

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
    let originalRequire;
    let req;
    let res;
    let next;

    beforeEach(() => {
      userSaveStub = sinon.stub().resolves();
      sinon.stub(crypto, 'randomBytes').returns(Buffer.alloc(20, 0xab));

      const fakeUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: true,
        save: userSaveStub,
      };
      userFindByIdStub = sinon.stub().resolves(fakeUser);

      const Module = require('module');
      originalRequire = Module.prototype.require;
      Module.prototype.require = function (id) {
        if (id === '../models/User') return { findById: userFindByIdStub };
        return originalRequire.apply(this, arguments);
      };

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
      const Module = require('module');
      Module.prototype.require = originalRequire;
      sinon.restore();
      delete require.cache[require.resolve('../controllers/user')];
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
});
