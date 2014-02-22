/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.editor = function(req, res) {
  res.render('editor', 
  	{ title: 'Editor' }
  );
};
