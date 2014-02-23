var mongoose = require('mongoose');


var fileSchema = new mongoose.Schema({
    filePath : String,
    comments :[{
	content: String,
	author: String,
	lineNumber : Number
    }]
});

fileSchema.statics.newFile = function(filePath, cb){
    var file = new this({
	filePath : filePath
    }).save(cb);
};

fileSchema.statics.retrieveFile = function(id, cb){
    var File = mongoose.model('File');
    File.findOne({_id:id},cb);
};

fileSchema.statics.addComment = function(id, content, author, lineNumber, cb){
    var File = mongoose.model('File');
    File.findOne({_id:id},function(err, file){
	if(err) {
	    cb(err);
	} else if (!file){
	    cb(new Error("No file with id "+id));
	} else {
	    file.comments.append({
		content : content,
		author : author,
		lineNumber : lineNumber
	    }).save(cb);
	}
    });
};

module.exports = mongoose.model('File', fileSchema);
