var fs = require('fs');
var mongoose = require('mongoose');
var File = mongoose.model('File');
var faye = require('faye');
var bayeux = new faye.NodeAdapter({mount: '/faye'});

exports = module.exports = function(server){
    bayeux.attach(server);

    var retrieveFileContents = function(data, cb){
	File.findOne({_id: data.fileId}, function(err, file){
	    if(err || !file) {
		cb( err || new Error('No file found'));
	    } else {
		fs.readFile(file.filePath, 'utf-8', function(err, content){
		    if(err){
			cb(err);
		    } else {
			cb(null, {filePath : file.filePath, content:content});
		    }
		});
	    }		    
 	});
    };

    var insertString = function(recipient, inserted, indexAt) {
	return ( recipient.slice(0,indexAt) + inserted + recipient.slice(indexAt));
    };

    //Data is of the form: {
    //  source : uuid,
    //  fileId : id,
    //  from : {
    //     line : Number,
    //     ch : Number,
    //  }, to : {
    //     line : Number,
    //     ch : Number,
    //  },
    //  text : String
    // }
    var updateStringAdd = function(originalStr, data){
	originalStr = originalStr.split("\n");
	originalStr[data.from.line] = insertString(originalStr[data.from.line], data.text, data.from.ch);
	return originalStr.join("\n");
    };

    var updateStringDelete = function(originalStr, data){
	originalStr = originalStr.split("\n");
	originalStr[data.from.line] = originalStr[data.from.line].substr(0, data.from.ch) + originalStr[data.from.line].substr(data.from.ch + data.text.length);
	return originalStr.join("\n");
    };

    bayeux.bind('publish', function(clientId, channel, data) {
	console.log( "Channel "+channel +" data "+JSON.stringify(data) );
	retrieveFileContents(data, function(err, file){
	    var result;
	    if(channel.indexOf('add') !== -1) {
		result = updateStringAdd(file.content, data);
	    } else if(channel.indexOf('delete') !== -1) {
		result = updateStringDelete(file.content, data);
	    }
	    fs.writeFile(file.filePath, result, function(err){
		if(err)
		    console.log( "Error "+err+" when updating file contents");
	    });
	});
    });
};

