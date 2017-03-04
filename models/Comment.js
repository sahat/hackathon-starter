var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var commentSchema = new mongoose.Schema({
  user: ObjectId,
  text: String
}, schemaOptions);

var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
