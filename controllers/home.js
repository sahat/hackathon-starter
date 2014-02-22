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

/**
 * POST /upload
 * Home page.
 */

exports.upload = function(req, res) {
	console.log(JSON.stringify(req.files));
	fs.readFile(req.files.file.path, function (err, data) {

		var imageName = req.files.file.name;

		// If there's an error
		if(!imageName){

			console.log("There was an error")
			res.redirect("/");
			res.end();

		} else {

		  var newPath = process.cwd() + "\\uploads\\" + imageName;
		  console.log(newPath);
		  /// write file to uploads/fullsize folder
		  fs.writeFile(newPath, data, function (err) {

		  	// 1. Create ID. Node.js NPM UUID
		  	// 2. Create object with (ID, PATH_TO_FILE)
		  });
		}
	});


};




