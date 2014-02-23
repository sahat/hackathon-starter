/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var File = mongoose.model('File');

/**
 * POST /upload
 * Home page.
 */
exports.upload = function(req, res) {
	fs.readFile(req.files.file.path, function (err, data) {
		var imageName = req.files.file.name;
		// If there's an error
		if(!imageName){
			console.log("There was an error");
			res.redirect("/");
			res.end();

		} else {

		  var newPath = path.join(process.cwd(), "uploads" ,imageName);
		  /// write file to uploads/fullsize folder
		  fs.writeFile(newPath, data, function (err) {
		  	File.newFile(newPath, function(err, doc){
		  		if(err)
		  			res.send(500, err);
		  		else {
		  			res.contentType('application/json');
					var data = JSON.stringify(doc._id);
					res.header('Content-Length', data.length);
					res.end(data);
		  		}
		  	});
		  });
		}
	});
};

exports.editor = function(req, res) {
    var id = req.params.id;
    File.retrieveFile(id, function(err, doc){
    	//if error
    	if(err){
    		res.send(500, err);
    	} else {
    		//retrieve file and send it
    		if(!doc){
    			res.status(404).render('404');
    		} else {
    			var file = doc.filePath;
				fs.readFile(file, 'utf-8', function(err, content){
					content = content.replace(/'/g,"&quot;");
					res.render('editor', 
						{ title: 'Editor', content : JSON.stringify(content), id: doc._id}
					);  
				});
    		}
    	}
	});
};

/* POST /editor/:id/comments */
exports.addComment = function(req, res) {
    var id = req.params.id;
    var lineNumber = req.body.lineNumber;
    var content = req.body.content;
    var author = req.body.author;
    File.addComment(id, content, author, lineNumber, function(err, file){
	if(err){
	    res.send(500, err);
	} else if (!file) {
	    res.send(404);
	} else {
	    res.send(200);
	}
	
    });
};

