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
    type: Sequelize.JSONB
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
    }
  }
});

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