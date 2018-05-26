var mongoose = require('mongoose');
var User = mongoose.model('User');
var Team = mongoose.model('Team');
var Phase = mongoose.model('Phase');

var request = require('request');
var apiOptions = {
    server: "http://localhost:8080"
};


//need to set this to production variable
if (process.env.NODE_ENV === 'production') {
    apiOptions.server = "https://nameless-basin-42853.herokuapp.com";
}


var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

// Create a new phase for a group and adds that phase to each athlete in the group
module.exports.createPhaseGroup = function(req, res) {
    if (req.params.teamid && req.params.groupid) {
        Team
            .findById(req.params.teamid)
            .select('groups')
            .exec(
                function(err, team) {
                    if (err) {
                        sendJsonResponse(res, 400, err);
                    } else {
                        //console.log(req.body);
                        //console.log(res);
                        //console.log(user);


                        thisGroup = team.groups.id(req.params.groupid);
                        if (!thisGroup) {
                            sendJsonResponse(res, 404, {
                                "message": "groupid not found"
                            });
                        } else {
                            console.log('group found');
                            doAddPhaseGroup(req, res, team, thisGroup);
                        }

                    }
                }
            );
    } else {
        sendJsonResponse(res, 404, {
            "message": "Not found, teamid and groupid required"
        });
    }

};

//adds phase to a group and adds phase to each athlete
var doAddPhaseGroup = (req, res, team, group) => {
    if (!group) {
        sendJsonResponse(res, 404, "group not found");
    } else {
        console.log('inside of doAddPhaseGroup');

        console.log(group);
        console.log(req.body);
        //var d = new Date();

        var phase = {
            name: req.body.name,
            start: req.body.start,
            end: req.body.end,
            workouts: req.body.workouts,
            notes: req.body.notes
        };

        var athletes = group.athletes;
        console.log(athletes);

        for (var i = 0; i < athletes.length; i++) {
            console.log(athletes[i]);
            var user_id = athletes[i];

            User
                .findById(user_id)
                .exec(function(err, user) {
                    if (!user) {
                        sendJsonResponse(res, 404, {
                            "message": "userid not found"
                        });
                        return;
                    } else if (err) {
                        console.log(err)
                        sendJsonResponse(res, 404, err);
                        return;
                    }

                    console.log('inside of addUser about to log user');
                    //console.log(user);
                    // console.log(user._id);
                    // var athlete_id = user._id;

                    //team.athletes.push(athlete_id);
                    user.athlete.phases.push(phase); //pushes phase to the user in the users collection


                    user.save((err) => {
                        if (err) {
                            console.log(err);
                            return err;
                        } else {
                            console.log('user saved successfully')
                        }

                    });
                })

        }

        group.phases.push(phase); //adds phase to the team document

        team.save(function(err, team) {
            // var thisPhase;
            if (err) {
                console.log(err);
                sendJsonResponse(res, 400, err);
            } else {

                thisPhase = group.phases[group.phases.length - 1];
                //console.log(thisAssignment);
                sendJsonResponse(res, 201, thisPhase);
            }
        });
    }
}

// Create a new phase for a Team and adds that phase to each athlete on the team
module.exports.createPhaseTeam = function(req, res) {
    if (req.params.teamid) {
        Team
            .findById(req.params.teamid)
            .select('phases athletes')
            .exec(
                function(err, team) {
                    if (err) {
                        sendJsonResponse(res, 400, err);
                    } else {
                        //console.log(req.body);
                        //console.log(res);
                        //console.log(user);
                        doAddPhaseTeam(req, res, team);
                    }
                }
            );
    } else {
        sendJsonResponse(res, 404, {
            "message": "Not found, teamid required"
        });
    }

};

var doAddPhaseTeam = function(req, res, team) {
    if (!team) {
        sendJsonResponse(res, 404, "teamid not found");
    } else {
        console.log('inside of doAddPhaseTeam');

        console.log(team);
        console.log(req.body);
        //var d = new Date();

        var phase = {
            name: req.body.name,
            start: req.body.start,
            end: req.body.end,
            workouts: req.body.workouts,
            notes: req.body.notes
        };

        var athletes = team.athletes;
        console.log(athletes);

        for (var i = 0; i < athletes.length; i++) {
            console.log(athletes[i]);
            var user_id = athletes[i];

            User
                .findById(user_id)
                .exec(function(err, user) {
                    if (!user) {
                        sendJsonResponse(res, 404, {
                            "message": "userid not found"
                        });
                        return;
                    } else if (err) {
                        console.log(err)
                        sendJsonResponse(res, 404, err);
                        return;
                    }

                    console.log('inside of addUser about to log user');
                    //console.log(user);
                    // console.log(user._id);
                    // var athlete_id = user._id;

                    //team.athletes.push(athlete_id);
                    user.athlete.phases.push(phase); //pushes phase to the user in the users collection


                    user.save((err) => {
                        if (err) {
                            console.log(err);
                            return err;
                        } else {
                            console.log('user saved successfully')
                        }

                    });
                })

        }

        team.phases.push(phase); //adds phase to the team document

        team.save(function(err, team) {
            // var thisPhase;
            if (err) {
                console.log(err);
                sendJsonResponse(res, 400, err);
            } else {

                thisPhase = team.phases[team.phases.length - 1];
                //console.log(thisAssignment);
                sendJsonResponse(res, 201, thisPhase);
            }
        });

    }
};



/**
 * GET /getPhaseByTeam
 * get all phases that are for the whole team
 */
exports.getPhasesByTeam = (req, res) => {

    console.log('Getting phases for one team')
    if (req.params && req.params.teamid) {
        Team
            .findById(req.params.teamid)
            .exec(function(err, team) {
                if (!team) {
                    sendJsonResponse(res, 404, {
                        "message": "teamid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                var phases = team.phases;
                sendJsonResponse(res, 200, phases);
            });
    } else {
        console.log('No teamid specified');
        sendJsonResponse(res, 404, {
            "message": "No teamid in request"
        });
    }

}

/**
 * GET /getPhaseByGroup
 * get all phases that are for the whole team
 */
exports.getPhasesByGroup = (req, res) => {
    if (req.params.teamid && req.params.groupid) {
        Team
            .findById(req.params.teamid)
            .select('groups')
            .exec(
                function(err, team) {
                    if (err) {
                        sendJsonResponse(res, 400, err);
                    } else {
                        //console.log(req.body);
                        //console.log(res);
                        //console.log(user);


                        thisGroup = team.groups.id(req.params.groupid);
                        if (!thisGroup) {
                            sendJsonResponse(res, 404, {
                                "message": "groupid not found"
                            });
                        } else {
                            console.log('group found');
                            var phases = thisGroup.phases;
                            sendJsonResponse(res, 200, phases);
                        }

                    }
                }
            );
    } else {
        sendJsonResponse(res, 404, {
            "message": "Not found, teamid and groupid required"
        });
    }

}