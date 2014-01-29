/**
 * GET /
 * Home page.
 */

exports.getDashboard = function(req, res) {
  res.render('dashboard', {
    title: 'Dashboard'
  });
};
