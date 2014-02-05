/**
 * Module Dependencies
 */
// None

module.exports.controller = function(app) {

/**
 * Home page route
 */
  app.get('/', function(req, res) {
    res.render('home', {
      title: 'Home'
    });
  });

}