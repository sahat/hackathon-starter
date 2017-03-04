var mongoose = require('mongoose');
var User = require('./User');
var VettRecord = require('./Comment');
var Schema = mongoose.Schema;

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var vettRecordSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  vettStatus: String,
  progress: Number,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
}, schemaOptions);

var VettRecord = mongoose.model('VettRecord', vettRecordSchema);

module.exports = VettRecord;
