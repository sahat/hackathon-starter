const crypto = require('crypto');
const bcrypt = require('@node-rs/bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

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

    tokens: { type: Array, default: [] },

    profile: {
      name: String,
      gender: String,
      location: String,
      website: String,
      picture: String,
    },
  },
  { timestamps: true },
);

// indexes
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ loginToken: 1 });

// virtuals
userSchema.virtual('isPasswordResetExpired').get(function () {
  return this.passwordResetExpires && Date.now() > this.passwordResetExpires;
});
userSchema.virtual('isEmailVerificationExpired').get(function () {
  return this.emailVerificationExpires && Date.now() > this.emailVerificationExpires;
});
userSchema.virtual('isLoginExpired').get(function () {
  return this.loginExpires && Date.now() > this.loginExpires;
});

// clear expired tokens
userSchema.pre('save', function (next) {
  const now = Date.now();
  const clear = (prefix) => {
    const exp = this[`${prefix}Expires`];
    if (exp && exp < now) {
      this[`${prefix}Token`] = undefined;
      this[`${prefix}Expires`] = undefined;
      this[`${prefix}IpHash`] = undefined;
    }
  };
  ['passwordReset', 'emailVerification', 'login'].forEach(clear);
  next();
});

// hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// compare password
userSchema.methods.comparePassword = async function (candidate, cb) {
  try {
    cb(null, await bcrypt.verify(candidate, this.password));
  } catch (err) {
    cb(err);
  }
};

// gravatar
userSchema.methods.gravatar = function (size = 200) {
  const base = 'https://gravatar.com/avatar';
  const hash = this.email
    ? crypto.createHash('sha256').update(this.email.trim().toLowerCase()).digest('hex')
    : '00000000000000000000000000000000';
  return `${base}/${hash}?s=${size}&d=retro`;
};

// verify token + IP
userSchema.methods.verifyTokenAndIp = function (token, ip, type) {
  try {
    const hashedIp = this.constructor.hashIP(ip);
    const t = `${type}Token`, ipH = `${type}IpHash`, exp = `${type}Expires`;

    if (!this[t] || !this[ipH] || !this[exp] || this[exp] < Date.now()) return false;

    const stored = Buffer.from(this[t]);
    const incoming = Buffer.from(token);
    if (stored.length !== incoming.length) return false;

    return crypto.timingSafeEqual(stored, incoming) && this[ipH] === hashedIp;
  } catch {
    return false;
  }
};

// statics
userSchema.statics.hashIP = (ip) => crypto.createHash('sha256').update(ip).digest('hex');
userSchema.statics.generateToken = () => crypto.randomBytes(32).toString('hex');

const User = mongoose.model('User', userSchema);
module.exports = User;
