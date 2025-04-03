const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  session: String,
  expires: Date,
});

sessionSchema.statics = {
  /**
   * Removes all valid sessions for a given user
   * @param {string} userId
   * @returns {Promise}
   */
  removeSessionByUserId(userId) {
    return this.deleteMany({
      expires: { $gt: new Date() },
      session: { $regex: userId },
    });
  },
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
