const Sport = require('../models/Sport');

/**
 * GET /signup
 * Signup page.
 */
exports.createSportForm = (req, res) => {
    res.render('sports/create', {
        title: 'Create Sport'
    });
};

exports.createSport = (req, res, next) => {

    // req.assert('sport', 'Sport name cannot be empty').len(2);

    const sport = new Sport({
        name: req.body.name,
        type: req.body.type
    });

    Sport.findOne({ name: req.body.name}, (err, existingSport) => {
        if (err) { return next(err); }
        if (existingSport) {
            req.flash('errors', { msg: 'Account with that email address already exists.' });
            return res.redirect('/createSportForm');
        }
        sport.save((err) => {
            if (err) { req.flash('errors', { msg: 'Account with that email address already exists.' }); }
                res.redirect('/');
            });
        });
};
