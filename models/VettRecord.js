var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var vettRecordSchema = new mongoose.Schema({
  user: User,
  vettStatus: String,
  progress: Number,
  comments: [Comment]
}, schemaOptions);

var VettRecord = mongoose.model('VettRecord', vettRecordSchema);

module.exports = VettRecord;
