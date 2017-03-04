var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var vettRecordSchema = new mongoose.Schema({
  user: ObjectId,
  vettStatus: String,
  progress: Number,
  comments: [ObjectId]
}, schemaOptions);

var VettRecord = mongoose.model('VettRecord', vettRecordSchema);

module.exports = VettRecord;
