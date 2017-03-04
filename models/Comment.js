var mongoose = require('mongoose');
var User = require('./User');
var Schema = mongoose.Schema;

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var commentSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  text: String
}, schemaOptions);

var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
