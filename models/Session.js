const mongoose = require('mongoose');
const validator = require('validator');

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
    // userId comes from Passport's serializeUser => user.id => Mongoose ObjectId.
    // Validate it so it contains only hex chars; then it is safe to embed into a RegExp
    // without regex-metacharacter escaping.
    if (!validator.isMongoId(userId)) {
      throw new Error('Invalid userId format.');
    }

    return this.deleteMany({
      expires: { $gt: new Date() },
      // Match any serialized session blob that contains the exact quoted ObjectId value.
      // This avoids relying on Passport's internal session object shape.
      session: { $regex: new RegExp(`"${userId}"`) },
    });
  },
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
