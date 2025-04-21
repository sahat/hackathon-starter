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
      });

      await user.save();

      expect(user.passwordResetToken).to.be.undefined;
      expect(user.emailVerificationToken).to.be.undefined;
      expect(user.loginToken).to.be.undefined;
    });
  });
});
