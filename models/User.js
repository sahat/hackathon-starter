const crypto = require('node:crypto');
const bcrypt = require('@node-rs/bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: String,

    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordResetIpHash: String,

    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerificationIpHash: String,
    emailVerified: { type: Boolean, default: false },

    loginToken: String,
    loginExpires: Date,
    loginIpHash: String,

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethods: { type: [String], enum: ['email', 'totp'], default: [] },
    twoFactorCode: String,
    twoFactorExpires: Date,
    twoFactorIpHash: String,
    totpSecret: String,

    webauthnUserID: { type: Buffer, minlength: 16, maxlength: 64 },
    webauthnCredentials: [
      {
        credentialId: { type: Buffer, required: true },
        publicKey: { type: Buffer, required: true },
        counter: { type: Number, required: true, default: 0 },
        transports: { type: [String], default: [] },
        deviceType: String,
        backedUp: Boolean,
        deviceName: String,
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: Date.now },
      },
    ],

    discord: String,
    facebook: String,
    github: String,
    google: String,
    linkedin: String,
    microsoft: String,
    quickbooks: String,
    steam: String,
    trakt: String,
    tumblr: String,
    twitch: String,
    x: String,

    tokens: Array,

    profile: {
      name: String,
      gender: String,
      location: String,
      website: String,
      picture: String,
      pictureSource: String,

      pictures: {
        type: Map,
        of: String,
      },
    },
  },
  { timestamps: true },
);

// Webauthn credential Id should be globally unique across all users
userSchema.index({ 'webauthnCredentials.credentialId': 1 }, { unique: true, sparse: true });

// Indexes for verification fields that are queried
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ loginToken: 1 });
userSchema.index({ twoFactorCode: 1 });

// Virtual properties for checking token expiration
userSchema.virtual('isPasswordResetExpired').get(function checkPasswordResetExpiration() {
  return Date.now() > this.passwordResetExpires;
});

userSchema.virtual('isEmailVerificationExpired').get(function checkEmailVerificationExpiration() {
  return Date.now() > this.emailVerificationExpires;
});

userSchema.virtual('isLoginExpired').get(function checkLoginTokenExpiration() {
  return Date.now() > this.loginExpires;
});

userSchema.virtual('isTwoFactorExpired').get(function checkTwoFactorExpiration() {
  return Date.now() > this.twoFactorExpires;
});

// Middleware to clear expired tokens on save
userSchema.pre('save', function clearExpiredTokens() {
  const now = Date.now();

  if (this.passwordResetExpires && this.passwordResetExpires < now) {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
    this.passwordResetIpHash = undefined;
  }

  if (this.emailVerificationExpires && this.emailVerificationExpires < now) {
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
    this.emailVerificationIpHash = undefined;
  }

  if (this.loginExpires && this.loginExpires < now) {
    this.loginToken = undefined;
    this.loginExpires = undefined;
    this.loginIpHash = undefined;
  }

  if (this.twoFactorExpires && this.twoFactorExpires < now) {
    this.clearTwoFactorCode();
  }
});

// Password hash middleware
userSchema.pre('save', async function hashPassword() {
  const user = this;
  if (!user.isModified('password')) {
    return;
  }
  user.password = await bcrypt.hash(user.password, 10);
});

// Helper method for validating password for login by password strategy
userSchema.methods.comparePassword = async function comparePassword(candidatePassword, cb) {
  try {
    cb(null, await bcrypt.verify(candidatePassword, this.password));
  } catch (err) {
    cb(err);
  }
};

// Helper method for getting gravatar
userSchema.methods.gravatar = function gravatarUrl(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=retro`;
  }
  const sha256 = crypto.createHash('sha256').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${sha256}?s=${size}&d=retro`;
};

userSchema.pre('save', function updateGravatarOnEmailChange() {
  if (!this.isModified('email')) return;
  if (!this.profile.pictures) {
    this.profile.pictures = new Map();
  }
  if (!this.profile.pictureSource) {
    this.profile.pictureSource = 'gravatar';
  }
  const url = this.gravatar();
  this.profile.pictures.set('gravatar', url);
  if (this.profile.pictureSource === 'gravatar') {
    this.profile.picture = url;
  }
});

userSchema.methods.noMultiPictureUpgrade = function noMultiPictureUpgrade() {
  if (!this.profile.pictures) {
    this.profile.pictures = new Map();
  }
  if (!this.profile.pictureSource) {
    this.profile.pictureSource = 'gravatar';
  }
  const url = this.gravatar();
  this.profile.pictures.set('gravatar', url);
  if (this.profile.pictureSource === 'gravatar') {
    this.profile.picture = url;
  }
};
// Helper method for clearing 2FA code fields (after use or expiration)
userSchema.methods.clearTwoFactorCode = function clearTwoFactorCode() {
  this.twoFactorCode = undefined;
  this.twoFactorExpires = undefined;
  this.twoFactorIpHash = undefined;
};

// Helper methods for creating hashed IP addresses
// This is used to prevent CSRF attacks by ensuring that the token is valid for
// the IP address it was generated from
userSchema.statics.hashIP = function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
};

// Helper methods for token generation
userSchema.statics.generateToken = function generateToken() {
  return crypto.randomBytes(32).toString('hex');
};

// Helper method for generating 6-digit codes
userSchema.statics.generateCode = function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper methods for token verification
userSchema.methods.verifyTokenAndIp = function verifyTokenAndIp(token, ip, tokenType) {
  const hashedIp = this.constructor.hashIP(ip);
  const tokenField = `${tokenType}Token`;
  const ipHashField = `${tokenType}IpHash`;
  const expiresField = `${tokenType}Expires`;

  // Comparing tokens in a timing-safe manner
  // This is to harden against timing attacks (CWE-208: Observable Timing Discrepancy)
  try {
    // First check if we have all required values
    if (!this[tokenField] || !token || !this[ipHashField] || !hashedIp) {
      return false;
    }

    // For plain string tokens, use Buffer.from without 'hex'
    const storedToken = Buffer.from(this[tokenField]);
    const inputToken = Buffer.from(token);

    // Ensure both buffers are the same length before comparing
    if (storedToken.length !== inputToken.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedToken, inputToken) && this[ipHashField] === hashedIp && this[expiresField] > Date.now();
  } catch (err) {
    console.log(err);
    return false;
  }
};

// Helper method for code verification (6-digit codes)
userSchema.methods.verifyCodeAndIp = function verifyCodeAndIp(code, ip, codeType) {
  const hashedIp = this.constructor.hashIP(ip);
  const codeField = `${codeType}Code`;
  const ipHashField = `${codeType}IpHash`;
  const expiresField = `${codeType}Expires`;
  try {
    if (!this[codeField] || !code || !this[ipHashField] || !hashedIp) {
      return false;
    }
    const storedCode = Buffer.from(this[codeField]);
    const inputCode = Buffer.from(code);
    if (storedCode.length !== inputCode.length) {
      return false;
    }
    return crypto.timingSafeEqual(storedCode, inputCode) && this[ipHashField] === hashedIp && this[expiresField] > Date.now();
  } catch (err) {
    console.log(err);
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
