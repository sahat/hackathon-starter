var mongoose = require('mongoose');
var User = mongoose.model('User');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

// Create a new team
module.exports.createPhase = function(req, res) {
    const phase = new Phase({
    	name: req.body.name,
        start: req.body.start,
        end: req.body.end,
  		workouts: req.body.workouts,
  		notes: req.body.notes
    });

    phase.save((err) => {
    	if (err) {
    		return next(err);
    	} else {
    		console.log('team successfully added')
    	}
    })
};

// Get a team by ID
module.exports.getPhaseById = function(req, res) {
	console.log('reading one phase');
    console.log('Finding phase details', req.params);
    if (req.params && req.params.phaseid) {
        User
            .findById(req.params.phaseid)
            .exec(function(err, phase) {
                if (!phase) {
                    sendJsonResponse(res, 404, {
                        "message": "phaseid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                sendJsonResponse(res, 200, user);
            });
    } else {
        console.log('No phaseid specified');
        sendJsonResponse(res, 404, {
            "message": "No teamid in request"
        });
    }
}

// Get all teams
module.exports.getAllPhases = function(req, res) {
	console.log('getting all phases');
    Phase
        .find()
        .exec(function(err, phase) {
            if (!team) {
                sendJsonResponse(res, 404, {
                    "message": "No phases found"
                });
                return;
            } else if (err) {
                console.log(err)
                sendJsonResponse(res, 404, err);
                return;
            }
            sendJsonResponse(res, 200, user);
        });
}

// Update a phase by ID
module.exports.updatePhase = function(req, res) {
	Phase.findById(req.teamid, (err, team) => {
    if (err) { return next(err); }
    team.name = req.body.name;
    team.athletes = req.body.athletes;
    team.groups = req.body.groups;
    team.save((err) => {
      	if (err) {
        	return next(err);
      	}
      	req.flash('success', { msg: 'Profile information has been updated.' });
      	console.log('team information was updated');
    });
  });
}


