const Sequelize = require('sequelize');
const bcrypt = require('@node-rs/bcrypt');
const crypto = require('crypto');

const sequelize = new Sequelize(process.env.POSTGRESQL_URI);

const User = sequelize.define('User', {
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  passwordResetToken: Sequelize.STRING,
  passwordResetExpires: Sequelize.DATE,
  emailVerificationToken: Sequelize.STRING,
  emailVerified: Sequelize.BOOLEAN,
  github: Sequelize.STRING,
  tokens: Sequelize.ARRAY(Sequelize.TEXT),
  profile: {
    type: Sequelize.JSONB,
    defaultValue: {},
    allowNull: false,
    get() {
      return this.getDataValue('profile') || {};
    },
    set(value) {
      this.setDataValue('profile', value);
    },
  },
  onboardingStatus: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  settings: {
    type: Sequelize.JSONB,
    defaultValue: {},
    allowNull: false,
    get() {
      return this.getDataValue('settings') || {};
    },
    set(value) {
      this.setDataValue('settings', value);
    },
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
    }
  }
});

User.prototype.getOnboardingStatus = function () {
  return this.onboardingStatus || false;
};

User.prototype.setOnboardingStatus = function (status) {
  this.onboardingStatus = status;
};

User.prototype.getSettings = function () {
  return this.settings || {};
};

User.prototype.setSettings = function (settings) {
  console.log('this.settings', this.settings);
  console.log('settings', settings);
  this.settings = settings;
};

User.prototype.enableGithub = function (username, token) {
  const settings = this.getSettings();
  settings.github = {
    enabled: true,
    username,
    token,
  };
  this.setSettings(settings);
};

User.prototype.disableGithub = function () {
  const settings = this.getSettings();
  settings.github = {
    enabled: false,
    username: '',
    token: '',
  };
  this.setSettings(settings);
};


// Synchronisation de la base de données avec le modèle
sequelize.sync()
  .then(() => {
    console.log('Tables synchronisées');
  })
  .catch((error) => {
    console.error('Erreur lors de la synchronisation de la base de données:', error);
  });

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

module.exports = User;