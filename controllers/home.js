/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
    
    res.redirect('/app.html');
  // res.render('home', {
  //   title: 'Home'
  // });
};