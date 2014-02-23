var mongoose = require('mongoose');


var fileSchema = new mongoose.Schema({
    filePath : String
});

fileSchema.statics.newFile = function(filePath, cb){
    var file = new this({
	filePath : filePath
    }).save(cb);
}

fileSchema.statics.retrieveFile = function(id, cb){
	var File = mongoose.model('File');
    File.findOne({_id:id},cb);
}

module.exports = mongoose.model('File', fileSchema);
