/**
 * GET /
 * Home page.
 */


exports.index = function(req, res) {
	res.render('home', {
		title: 'Home'
	});
};

exports.dashboard = function(req, res) {
  res.render('dashboard', {
    title: 'Dashboard Page'
  });
};

exports.newEvent = function(req, res) {
	res.render('new_event', {
		title: 'New Event'
	});
};