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


    console.log(sport);




    Sport.findOne({ name: req.body.name}, (err, existingSport) => {
        if (err) { return next(err); }
        if (existingSport) {
            req.flash('errors', { msg: 'Sport  with that name address already exists.' });
            return res.redirect('/createSportForm');
        }
        sport.save((err) => {
            if (err) { req.flash('errors', { msg: 'cannot save' }); }
                res.redirect('/sport/'+sport.name);
            });
        });
};

exports.multipleSports =(req,res) => {
    for(var i=1; i<=10; i++){
        const sport = new Sport({
            name: "cricket"+i,
            type: "outdoor"+i
        });
        sport.save((err) =>{
            if (err) { req.flash('errors', { msg: 'cannot save' }); }
        })
    }
    res.redirect('/list');
};

exports.listSports = (req, res) => {
    Sport.find({}, function(err, sports) {
        if (err) { req.flash('errors', { msg: 'Account with that email address already exists.' }); }

        res.render("sports/list", {sportList: sports, title: "List of sports"});

    })

}

exports.showSport = (req, res) => {
    Sport.findOne({name: req.params.name}, function(err, sports){
        if (err) { req.flash('errors', { msg: 'Account with that email address already exists.' }); }
        res.render("sports/sport", {sportList: sports, title: "List of sports"});
    })
}

exports.deleteSport = (req, res) => {
    Sport.findOneAndRemove({name: req.body.name}, function(err, sports){
        if (err) { req.flash('errors', { msg: 'Account with that email address already exists.' }); }
       // res.redirect("/list");
       //  res.json({error:err,sport:sports});
        res.send("done");
    })
}

exports.updateSportForm =(req,res) => {
    Sport.findOne({name: req.params.name}, function(err, sport){
        console.log(err,sport)
        if (err) { req.flash('errors', { msg: 'Account with that email address already exists.' }); }
        res.render('sports/update', {sport:sport});

    })
}
exports.updateSport = (req, res) => {
    Sport.findOneAndUpdate({_id: req.body.id}, req.body,{new: true}, function(err, place){
        console.log(place);
        res.redirect('/list');
    })
}

