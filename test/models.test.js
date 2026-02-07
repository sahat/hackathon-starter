const crypto = require('node:crypto');
const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('@node-rs/bcrypt');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

describe('User Model', () => {
  let mongoServer;

  before(async () => {
    // Close any existing connections
    await mongoose.disconnect();

    // Create new mongo instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Configure mongoose to not wait for other connections
    const mongooseOpts = {
      autoIndex: false,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    };

    await mongoose.connect(mongoUri, mongooseOpts);
  });

  beforeEach(async () => {
    // Drop the entire database between tests
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await User.createIndexes();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should create a new user', (done) => {
    const UserMock = sinon.mock(new User({ email: 'test@gmail.com', password: 'root' }));
    const user = UserMock.object;

    UserMock.expects('save').yields(null);

    user.save((err) => {
      UserMock.verify();
      UserMock.restore();
      expect(err).to.be.null;
      done();
    });
  });

  it('should return error if user is not created', (done) => {
    const UserMock = sinon.mock(new User({ email: 'test@gmail.com', password: 'root' }));
    const user = UserMock.object;
    const expectedError = {
      name: 'ValidationError',
    };

    UserMock.expects('save').yields(expectedError);

    user.save((err, result) => {
      UserMock.verify();
      UserMock.restore();
      expect(err.name).to.equal('ValidationError');
      expect(result).to.be.undefined;
      done();
    });
  });

  it('should not create a user with the unique email', (done) => {
    const UserMock = sinon.mock(User({ email: 'test@gmail.com', password: 'root' }));
    const user = UserMock.object;
    const expectedError = {
      name: 'MongoError',
      code: 11000,
    };

    UserMock.expects('save').yields(expectedError);

    user.save((err, result) => {
      UserMock.verify();
      UserMock.restore();
      expect(err.name).to.equal('MongoError');
      expect(err.code).to.equal(11000);
      expect(result).to.be.undefined;
      done();
    });
  });

  it('should find user by email', (done) => {
    const userMock = sinon.mock(User);
    const expectedUser = {
      _id: '5700a128bd97c1341d8fb365',
      email: 'test@gmail.com',
    };

    userMock.expects('findOne').withArgs({ email: 'test@gmail.com' }).yields(null, expectedUser);

    User.findOne({ email: 'test@gmail.com' }, (err, result) => {
      userMock.verify();
      userMock.restore();
      expect(result.email).to.equal('test@gmail.com');
      done();
    });
  });

  it('should remove user by email', (done) => {
    const userMock = sinon.mock(User);
    const expectedResult = {
      nRemoved: 1,
    };

    userMock.expects('deleteOne').withArgs({ email: 'test@gmail.com' }).yields(null, expectedResult);

    User.deleteOne({ email: 'test@gmail.com' }, (err, result) => {
      userMock.verify();
      userMock.restore();
      expect(err).to.be.null;
      expect(result.nRemoved).to.equal(1);
      done();
    });
  });

  it('should check password', async () => {
    const UserMock = sinon.mock(
      new User({
        email: 'test@gmail.com',
        password: '$2y$10$ux4O8y0CCilFQ5JS66namekb9Hbr1AN7kwEDn2ej6e6AYw3BPqAVa',
      }),
    );

    const user = UserMock.object;
    const comparePasscbSpy = sinon.spy();
    await user.comparePassword('root1234', comparePasscbSpy);
    expect(comparePasscbSpy.calledOnceWithExactly(null, true)).to.be.true;
  });

  it('should generate gravatar without email and size', () => {
    const UserMock = sinon.mock(new User({}));
    const user = UserMock.object;

    const gravatar = user.gravatar();
    const { host } = new URL(gravatar);
    expect(host).to.equal('gravatar.com');
  });

  it('should generate gravatar with size', () => {
    const UserMock = sinon.mock(new User({}));
    const user = UserMock.object;
    const size = 300;

    const gravatar = user.gravatar(size);
    expect(gravatar.includes(`s=${size}`)).to.equal(true);
  });

  it('should generate gravatar with email', () => {
    const UserMock = sinon.mock(new User({ email: 'test@gmail.com' }));
    const user = UserMock.object;
    const sha256 = '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674';

    const gravatar = user.gravatar();
    expect(gravatar.includes(sha256)).to.equal(true);
  });

  it('should define webauthnUserID as a Buffer in the schema', () => {
    const path = User.schema.paths.webauthnUserID;
    expect(path).to.exist;
    expect(path.instance).to.equal('Buffer');
  });

  it('should persist webauthnUserID across save and reload', async () => {
    const user = await User.create({
      email: 'webauthn@test.com',
      password: 'password123',
    });

    const webauthnUserID = crypto.randomBytes(32);
    user.webauthnUserID = webauthnUserID;
    await user.save();

    const reloaded = await User.findById(user._id);

    expect(reloaded.webauthnUserID).to.exist;
    expect(Buffer.isBuffer(reloaded.webauthnUserID)).to.be.true;
    expect(reloaded.webauthnUserID.equals(webauthnUserID)).to.be.true;
  });

  it('should enforce global uniqueness of webauthn credentialId', async () => {
    const credentialId = Buffer.from('duplicate-credential-id');

    await User.create({
      email: 'user1@test.com',
      password: 'password',
      webauthnCredentials: [{ credentialId, publicKey: Buffer.from([1]), counter: 0 }],
    });

    try {
      await User.create({
        email: 'user2@test.com',
        password: 'password',
        webauthnCredentials: [{ credentialId, publicKey: Buffer.from([2]), counter: 0 }],
      });
      throw new Error('Expected duplicate key error');
    } catch (err) {
      expect(err).to.have.property('code', 11000);
    }
  });

  it('should persist webauthn publicKey as binary without corruption', async () => {
    const publicKey = crypto.randomBytes(65);

    const user = await User.create({
      email: 'binary@test.com',
      password: 'password',
      webauthnCredentials: [
        {
          credentialId: crypto.randomBytes(32),
          publicKey,
          counter: 0,
        },
      ],
    });

    const reloaded = await User.findById(user._id);
    const storedKey = reloaded.webauthnCredentials[0].publicKey;

    expect(Buffer.isBuffer(storedKey)).to.be.true;
    expect(storedKey.equals(publicKey)).to.be.true;
  });

  it('should not regenerate webauthnUserID once set', async () => {
    const user = await User.create({
      email: 'stable@test.com',
      password: 'password',
      webauthnUserID: crypto.randomBytes(32),
    });

    const original = user.webauthnUserID;
    await user.save();

    const reloaded = await User.findById(user._id);
    expect(reloaded.webauthnUserID.equals(original)).to.be.true;
  });

  describe('Token Verification', () => {
    it('should verify valid token and IP hash before expiration', () => {
      const token = 'testtoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          emailVerificationToken: token,
          emailVerificationIpHash: User.hashIP(ip),
          emailVerificationExpires: Date.now() + 3600000, // 1 hour in the future
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'emailVerification');
      expect(isValid).to.be.true;
    });

    it('should reject expired token', () => {
      const token = 'testtoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          emailVerificationToken: token,
          emailVerificationIpHash: User.hashIP(ip),
          emailVerificationExpires: Date.now() - 3600000, // 1 hour in the past
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'emailVerification');
      expect(isValid).to.be.false;
    });

    it('should reject invalid token', () => {
      const token = 'testtoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          emailVerificationToken: 'differenttoken',
          emailVerificationIpHash: User.hashIP(ip),
          emailVerificationExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'emailVerification');
      expect(isValid).to.be.false;
    });

    it('should reject invalid IP', () => {
      const token = 'testtoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          emailVerificationToken: token,
          emailVerificationIpHash: User.hashIP('192.168.1.1'),
          emailVerificationExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'emailVerification');
      expect(isValid).to.be.false;
    });

    it('should handle missing token fields', () => {
      const token = 'testtoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(new User({}));
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'emailVerification');
      expect(isValid).to.be.false;
    });
  });
  describe('Password Reset Token Verification', () => {
    it('should verify valid password reset token and IP hash before expiration', () => {
      const token = 'resettoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          passwordResetToken: token,
          passwordResetIpHash: User.hashIP(ip),
          passwordResetExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'passwordReset');
      expect(isValid).to.be.true;
    });

    it('should reject expired password reset token', () => {
      const token = 'resettoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          passwordResetToken: token,
          passwordResetIpHash: User.hashIP(ip),
          passwordResetExpires: Date.now() - 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'passwordReset');
      expect(isValid).to.be.false;
    });

    it('should reject invalid password reset token', () => {
      const token = 'resettoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          passwordResetToken: 'differenttoken',
          passwordResetIpHash: User.hashIP(ip),
          passwordResetExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'passwordReset');
      expect(isValid).to.be.false;
    });

    it('should reject invalid IP for password reset', () => {
      const token = 'resettoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          passwordResetToken: token,
          passwordResetIpHash: User.hashIP('192.168.1.1'),
          passwordResetExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'passwordReset');
      expect(isValid).to.be.false;
    });
  });

  describe('Login Token Verification', () => {
    it('should verify valid login token and IP hash before expiration', () => {
      const token = 'logintoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          loginToken: token,
          loginIpHash: User.hashIP(ip),
          loginExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'login');
      expect(isValid).to.be.true;
    });

    it('should reject expired login token', () => {
      const token = 'logintoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          loginToken: token,
          loginIpHash: User.hashIP(ip),
          loginExpires: Date.now() - 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'login');
      expect(isValid).to.be.false;
    });

    it('should reject invalid login token', () => {
      const token = 'logintoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          loginToken: 'differenttoken',
          loginIpHash: User.hashIP(ip),
          loginExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'login');
      expect(isValid).to.be.false;
    });

    it('should reject invalid IP for login', () => {
      const token = 'logintoken123';
      const ip = '127.0.0.1';
      const UserMock = sinon.mock(
        new User({
          loginToken: token,
          loginIpHash: User.hashIP('192.168.1.1'),
          loginExpires: Date.now() + 3600000,
        }),
      );
      const user = UserMock.object;

      const isValid = user.verifyTokenAndIp(token, ip, 'login');
      expect(isValid).to.be.false;
    });
  });

  describe('IP Hashing', () => {
    it('should consistently hash the same IP', () => {
      const ip = '127.0.0.1';
      const hash1 = User.hashIP(ip);
      const hash2 = User.hashIP(ip);
      expect(hash1).to.equal(hash2);
    });

    it('should produce different hashes for different IPs', () => {
      const hash1 = User.hashIP('127.0.0.1');
      const hash2 = User.hashIP('192.168.1.1');
      expect(hash1).to.not.equal(hash2);
    });
  });

  describe('User Model Virtual Properties', () => {
    it('should check if password reset is expired', () => {
      const user = new User({
        passwordResetExpires: Date.now() - 3600000,
      });
      expect(user.isPasswordResetExpired).to.be.true;
    });

    it('should check if email verification is expired', () => {
      const user = new User({
        emailVerificationExpires: Date.now() - 3600000,
      });
      expect(user.isEmailVerificationExpired).to.be.true;
    });

    it('should check if login token is expired', () => {
      const user = new User({
        loginExpires: Date.now() - 3600000,
      });
      expect(user.isLoginExpired).to.be.true;
    });

    it('should check if 2FA code is expired', () => {
      const user = new User({
        twoFactorExpires: Date.now() - 3600000,
      });
      expect(user.isTwoFactorExpired).to.be.true;
    });
  });

  describe('User Password Handling', () => {
    it('should handle error during password comparison', async () => {
      const user = new User({ password: 'invalid-hash' });
      await new Promise((resolve) => {
        user.comparePassword('password', (err) => {
          expect(err).to.exist;
          resolve();
        });
      });
    });

    it('should handle password hashing error', async () => {
      const user = new User({
        email: 'test@example.com', // Add required email field
        password: 'test',
      });
      // Mock bcrypt to throw error
      sinon.stub(bcrypt, 'hash').rejects(new Error('Hash error'));

      try {
        await user.save();
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err.message).to.equal('Hash error');
      } finally {
        bcrypt.hash.restore();
      }
    });

    it('should reject password shorter than minimum length', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'short',
      });

      try {
        await user.save();
        expect.fail('Should have thrown validation error');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should handle undefined password gracefully', async () => {
      const user = new User({
        email: 'test@example.com',
      });

      try {
        await user.save();
        expect.fail('Should have thrown validation error');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });
  });

  describe('Gravatar URL Generation', () => {
    it('should generate default gravatar URL when email is missing', () => {
      const user = new User();
      const url = user.gravatar(200);
      expect(url).to.include('00000000000000000000000000000000');
    });

    it('Scenario 1: Gravatar generation when email is present - after save', async () => {
      const user = new User({
        email: 'test@gmail.com',
        password: 'password123',
      });

      await user.save();

      const sha256 = '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674';

      expect(user.profile.pictures).to.be.instanceOf(Map);
      expect(user.profile.pictures.get('gravatar')).to.include(sha256);
      expect(user.profile.pictureSource).to.equal('gravatar');
      expect(user.profile.picture).to.include(sha256);
    });

    it('Scenario 2: Gravatar update on email change', async () => {
      const user = new User({
        email: 'user1@example.com',
        password: 'password123',
      });

      await user.save();

      const originalGravatar = user.profile.pictures.get('gravatar');
      expect(user.profile.picture).to.equal(originalGravatar);

      // Change email
      user.email = 'user2@example.com';
      await user.save();

      const newGravatar = user.profile.pictures.get('gravatar');
      expect(newGravatar).to.not.equal(originalGravatar);
      expect(user.profile.picture).to.equal(newGravatar);
    });

    it('Scenario 3: noMultiPictureUpgrade behavior', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      user.noMultiPictureUpgrade();

      expect(user.profile.pictures).to.be.instanceOf(Map);
      expect(user.profile.pictureSource).to.equal('gravatar');
      expect(user.profile.pictures.get('gravatar')).to.include(user.gravatar());
      expect(user.profile.picture).to.equal(user.gravatar());
    });

    it('Scenario 4: Preserve non-gravatar pictureSource', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        profile: {
          pictureSource: 'facebook',
          picture: 'https://facebook/pic.jpg',
        },
      });

      await user.save();

      expect(user.profile.pictures.get('gravatar')).to.include(user.gravatar());
      expect(user.profile.picture).to.equal('https://facebook/pic.jpg');
      expect(user.profile.pictureSource).to.equal('facebook');
    });

    it('Scenario 5: Preserve non-gravatar pictureSource - noMultiPictureUpgrade', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        profile: {
          pictureSource: 'github',
          picture: 'https://github/pic.jpg',
        },
      });

      user.noMultiPictureUpgrade();

      expect(user.profile.pictures.get('gravatar')).to.include(user.gravatar());
      expect(user.profile.picture).to.equal('https://github/pic.jpg');
      expect(user.profile.pictureSource).to.equal('github');
    });

    it('Scenario 6: Legacy account upgrade path', () => {
      const user = new User({
        email: 'legacy@example.com',
        password: 'password123',
        profile: {
          picture: 'old-picture.jpg',
          // pictureSource and pictures are undefined
        },
      });

      user.noMultiPictureUpgrade();

      expect(user.profile.pictures).to.be.instanceOf(Map);
      expect(user.profile.pictures.get('gravatar')).to.include(user.gravatar());
      expect(user.profile.pictureSource).to.equal('gravatar');
      expect(user.profile.picture).to.equal(user.gravatar());
    });

    it('Scenario 7: Map persistence', async () => {
      const user = new User({
        email: 'maptest@example.com',
        password: 'password123',
      });

      await user.save();

      const reloaded = await User.findById(user._id);

      expect(reloaded.profile.pictures).to.be.instanceOf(Map);
      expect(reloaded.profile.pictures.get('gravatar')).to.include(user.gravatar());
    });

    it('Scenario 8: No duplicate gravatar entries', async () => {
      const user = new User({
        email: 'noduplicate@example.com',
        password: 'password123',
      });

      await user.save();
      const initialSize = user.profile.pictures.size;

      // Save again without changing email
      await user.save();

      expect(user.profile.pictures.size).to.equal(initialSize);
      expect(user.profile.pictures.get('gravatar')).to.include(user.gravatar());
    });
  });

  describe('Token Cleanup on Save', () => {
    it('should clear expired tokens before save', async () => {
      const user = new User({
        email: 'test@example.com', // Add required email field
        password: 'testpassword', // Add password if it's required
        passwordResetToken: 'token',
        passwordResetExpires: Date.now() - 3600000,
        passwordResetIpHash: 'hash',
        emailVerificationToken: 'token',
        emailVerificationExpires: Date.now() - 3600000,
        emailVerificationIpHash: 'hash',
        loginToken: 'token',
        loginExpires: Date.now() - 3600000,
        loginIpHash: 'hash',
        twoFactorCode: '123456',
        twoFactorExpires: Date.now() - 3600000,
        twoFactorIpHash: 'hash',
      });

      await user.save();

      expect(user.passwordResetToken).to.be.undefined;
      expect(user.emailVerificationToken).to.be.undefined;
      expect(user.loginToken).to.be.undefined;
      expect(user.twoFactorCode).to.be.undefined;
    });
  });

  describe('Two-Factor Authentication', () => {
    describe('Code Generation', () => {
      it('should generate a 6-digit code', () => {
        const code = User.generateCode();
        expect(code).to.match(/^\d{6}$/);
        expect(parseInt(code, 10)).to.be.at.least(100000);
        expect(parseInt(code, 10)).to.be.at.most(999999);
      });

      it('should generate unique codes', () => {
        const codes = new Set();
        for (let i = 0; i < 100; i++) {
          codes.add(User.generateCode());
        }
        expect(codes.size).to.be.greaterThan(90);
      });
    });

    describe('2FA Code Verification', () => {
      it('should verify valid 2FA code and IP before expiration', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: code,
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        const isValid = user.verifyCodeAndIp(code, ip, 'twoFactor');
        expect(isValid).to.be.true;
      });

      it('should reject expired 2FA code', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: code,
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() - 600000,
        });

        const isValid = user.verifyCodeAndIp(code, ip, 'twoFactor');
        expect(isValid).to.be.false;
      });

      it('should reject invalid 2FA code', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: '654321',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        const isValid = user.verifyCodeAndIp(code, ip, 'twoFactor');
        expect(isValid).to.be.false;
      });

      it('should reject code from different IP', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: code,
          twoFactorIpHash: User.hashIP('192.168.1.1'),
          twoFactorExpires: Date.now() + 600000,
        });

        const isValid = user.verifyCodeAndIp(code, ip, 'twoFactor');
        expect(isValid).to.be.false;
      });

      it('should handle missing code fields', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
        });

        const isValid = user.verifyCodeAndIp(code, ip, 'twoFactor');
        expect(isValid).to.be.false;
      });

      it('should reject empty string code', () => {
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp('', ip, 'twoFactor')).to.be.false;
      });

      it('should reject null code', () => {
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp(null, ip, 'twoFactor')).to.be.false;
      });

      it('should reject undefined code', () => {
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp(undefined, ip, 'twoFactor')).to.be.false;
      });

      it('should reject code with wrong length', () => {
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp('12345', ip, 'twoFactor')).to.be.false;
        expect(user.verifyCodeAndIp('1234567', ip, 'twoFactor')).to.be.false;
      });

      it('should reject code with non-numeric characters', () => {
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp('abcdef', ip, 'twoFactor')).to.be.false;
      });

      it('should reject when stored code is missing but other fields exist', () => {
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp('123456', ip, 'twoFactor')).to.be.false;
      });

      it('should reject when IP hash is missing but other fields exist', () => {
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp('123456', '127.0.0.1', 'twoFactor')).to.be.false;
      });

      it('should use timing-safe comparison for codes', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: code,
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        const startTime = process.hrtime.bigint();
        user.verifyCodeAndIp('123456', ip, 'twoFactor');
        const validTime = process.hrtime.bigint() - startTime;

        const startTime2 = process.hrtime.bigint();
        user.verifyCodeAndIp('654321', ip, 'twoFactor');
        const invalidTime = process.hrtime.bigint() - startTime2;

        const timeDiff = Math.abs(Number(validTime - invalidTime));
        expect(timeDiff).to.be.lessThan(1000000);
      });
    });

    describe('2FA Methods Management', () => {
      it('should initialize with empty twoFactorMethods array', async () => {
        const user = await User.create({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(user.twoFactorMethods).to.be.an('array');
        expect(user.twoFactorMethods).to.have.lengthOf(0);
        expect(user.twoFactorEnabled).to.be.false;
      });

      it('should add email to twoFactorMethods', async () => {
        const user = await User.create({
          email: 'test@example.com',
          password: 'password123',
        });

        user.twoFactorEnabled = true;
        user.twoFactorMethods.push('email');
        await user.save();

        const reloaded = await User.findById(user._id);
        expect(reloaded.twoFactorMethods).to.include('email');
        expect(reloaded.twoFactorEnabled).to.be.true;
      });

      it('should add multiple 2FA methods', async () => {
        const user = await User.create({
          email: 'test@example.com',
          password: 'password123',
        });

        user.twoFactorEnabled = true;
        user.twoFactorMethods.push('email', 'totp');
        await user.save();

        const reloaded = await User.findById(user._id);
        expect(reloaded.twoFactorMethods).to.have.lengthOf(2);
        expect(reloaded.twoFactorMethods).to.include('email');
        expect(reloaded.twoFactorMethods).to.include('totp');
      });

      it('should remove individual 2FA method', async () => {
        const user = await User.create({
          email: 'test@example.com',
          password: 'password123',
          twoFactorEnabled: true,
          twoFactorMethods: ['email', 'totp'],
        });

        user.twoFactorMethods = user.twoFactorMethods.filter((m) => m !== 'email');
        await user.save();

        const reloaded = await User.findById(user._id);
        expect(reloaded.twoFactorMethods).to.have.lengthOf(1);
        expect(reloaded.twoFactorMethods).to.include('totp');
        expect(reloaded.twoFactorMethods).to.not.include('email');
      });

      it('should disable 2FA when all methods removed', async () => {
        const user = await User.create({
          email: 'test@example.com',
          password: 'password123',
          twoFactorEnabled: true,
          twoFactorMethods: ['email'],
        });

        user.twoFactorMethods = [];
        user.twoFactorEnabled = false;
        await user.save();

        const reloaded = await User.findById(user._id);
        expect(reloaded.twoFactorMethods).to.have.lengthOf(0);
        expect(reloaded.twoFactorEnabled).to.be.false;
      });

      it('should accept email as a valid method', async () => {
        const user = await User.create({
          email: 'enum-test1@example.com',
          password: 'password123',
          twoFactorMethods: ['email'],
        });
        expect(user.twoFactorMethods).to.deep.equal(['email']);
      });

      it('should accept totp as a valid method', async () => {
        const user = await User.create({
          email: 'enum-test2@example.com',
          password: 'password123',
          twoFactorMethods: ['totp'],
        });
        expect(user.twoFactorMethods).to.deep.equal(['totp']);
      });

      it('should reject invalid 2FA method values', async () => {
        try {
          await User.create({
            email: 'enum-test3@example.com',
            password: 'password123',
            twoFactorMethods: ['sms'],
          });
          expect.fail('Should have thrown validation error');
        } catch (err) {
          expect(err.name).to.equal('ValidationError');
        }
      });
    });

    describe('2FA Virtual Properties', () => {
      it('should check if 2FA code is not expired', () => {
        const user = new User({
          twoFactorExpires: Date.now() + 600000,
        });
        expect(user.isTwoFactorExpired).to.be.false;
      });
    });

    describe('2FA Token Cleanup', () => {
      it('should clear expired 2FA code on save', async () => {
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: '123456',
          twoFactorExpires: Date.now() - 600000,
          twoFactorIpHash: 'hash',
        });

        await user.save();

        expect(user.twoFactorCode).to.be.undefined;
        expect(user.twoFactorExpires).to.be.undefined;
        expect(user.twoFactorIpHash).to.be.undefined;
      });

      it('should not clear valid 2FA code on save', async () => {
        const code = '123456';
        const user = new User({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: code,
          twoFactorExpires: Date.now() + 600000,
          twoFactorIpHash: 'hash',
        });

        await user.save();

        expect(user.twoFactorCode).to.equal(code);
        expect(user.twoFactorExpires).to.exist;
        expect(user.twoFactorIpHash).to.equal('hash');
      });
    });

    describe('clearTwoFactorCode', () => {
      it('should clear all three 2FA code fields', () => {
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: '123456',
          twoFactorExpires: Date.now() + 600000,
          twoFactorIpHash: 'somehash',
        });

        user.clearTwoFactorCode();

        expect(user.twoFactorCode).to.be.undefined;
        expect(user.twoFactorExpires).to.be.undefined;
        expect(user.twoFactorIpHash).to.be.undefined;
      });

      it('should be safe to call when fields are already undefined', () => {
        const user = new User({ email: 'test@example.com' });

        user.clearTwoFactorCode();

        expect(user.twoFactorCode).to.be.undefined;
        expect(user.twoFactorExpires).to.be.undefined;
        expect(user.twoFactorIpHash).to.be.undefined;
      });

      it('should not affect other user fields', () => {
        const user = new User({
          email: 'test@example.com',
          twoFactorEnabled: true,
          twoFactorMethods: ['email'],
          twoFactorCode: '123456',
          twoFactorExpires: Date.now() + 600000,
          twoFactorIpHash: 'somehash',
        });

        user.clearTwoFactorCode();

        expect(user.twoFactorEnabled).to.be.true;
        expect(user.twoFactorMethods).to.include('email');
        expect(user.email).to.equal('test@example.com');
      });
    });

    describe('Code consumption (single-use)', () => {
      it('should not verify after clearTwoFactorCode is called', () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = new User({
          email: 'test@example.com',
          twoFactorCode: code,
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp(code, ip, 'twoFactor')).to.be.true;

        user.clearTwoFactorCode();

        expect(user.verifyCodeAndIp(code, ip, 'twoFactor')).to.be.false;
      });

      it('should persist cleared state after save', async () => {
        const code = '123456';
        const ip = '127.0.0.1';
        const user = await User.create({
          email: 'consume-test@example.com',
          password: 'password123',
          twoFactorCode: code,
          twoFactorIpHash: User.hashIP(ip),
          twoFactorExpires: Date.now() + 600000,
        });

        expect(user.verifyCodeAndIp(code, ip, 'twoFactor')).to.be.true;

        user.clearTwoFactorCode();
        await user.save();

        const reloaded = await User.findById(user._id);
        expect(reloaded.twoFactorCode).to.be.undefined;
        expect(reloaded.twoFactorExpires).to.be.undefined;
        expect(reloaded.twoFactorIpHash).to.be.undefined;
        expect(reloaded.verifyCodeAndIp(code, ip, 'twoFactor')).to.be.false;
      });
    });

    describe('2FA Index', () => {
      it('should have index on twoFactorCode field', async () => {
        const indexes = await User.collection.getIndexes();
        const hasIndex = Object.keys(indexes).some((key) => key.includes('twoFactorCode'));
        expect(hasIndex).to.be.true;
      });
    });
  });
});
