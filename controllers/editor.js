/**
 * GET /
 * Home page.
 */

exports.editor = function(req, res) {
  res.render('editor', 
  	{ title: 'Editor' }
  );
};
