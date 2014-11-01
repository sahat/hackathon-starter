/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.astral = function(req, res) {
  res.render('astral', {
    title: 'Astral'
  });
};