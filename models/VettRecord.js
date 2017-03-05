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
  rawFormData: String,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
}, schemaOptions);

vettRecordSchema.virtual('formData').get(function() {
  if (!this.get('rawFormData')) {
    return undefined;
  }

  return JSON.parse(this.get('rawFormData'));
});

var VettRecord = mongoose.model('VettRecord', vettRecordSchema);



module.exports = VettRecord;
