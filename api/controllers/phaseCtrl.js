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
    // if (req.params.teamid) {
    //     Team
    //         .findById(req.params.teamid)
    //         .select('phases athletes')
    //         .exec(
    //             function(err, team) {
    //                 if (err) {
    //                     sendJsonResponse(res, 400, err);
    //                 } else {
    //                     //console.log(req.body);
    //                     //console.log(res);
    //                     //console.log(user);
    //                     doAddPhaseTeam(req, res, team);
    //                 }
    //             }
    //         );
    // } else {
    //     sendJsonResponse(res, 404, {
    //         "message": "Not found, teamid required"
    //     });
    // }

};

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
                    user.athlete.phases.push(phase);//pushes phase to the user in the users collection


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

        team.phases.push(phase);//adds phase to the team document

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


// Get a phase by ID from the Team
module.exports.getAthletePhaseByIdTeam = function(req, res) {
    console.log("Getting phase by id");
    if (req.params && req.params.teamid && req.params.phasesid) {
        User
            .findById(req.params.userid)
            .select('sale')
            .exec(
                function(err, user) {
                    //console.log(user);
                    var response, item;
                    if (!user) {
                        sendJsonResponse(res, 404, {
                            "message": "userid not found"
                        });
                        return;
                    } else if (err) {
                        sendJsonResponse(res, 400, err);
                        return;
                    }
                    if (user.sale) {
                        item = user.sale.id(req.params.itemid);
                        if (!item) {
                            sendJsonResponse(res, 404, {
                                "message": "itemid not found"
                            });
                        } else {
                            response = {
                                user: {
                                    id: req.params.userid
                                },
                                item: item
                            };
                            sendJsonResponse(res, 200, response);
                        }
                    } else {
                        sendJsonResponse(res, 404, {
                            "message": "No item found"
                        });
                    }
                }
            );
    } else {
        sendJsonResponse(res, 404, {
            "message": "Not found, userid and itemid are both required"
        });
    }
}

// Get all phases
// module.exports.getAllPhases = function(req, res) {
//     console.log('getting all phases');
//     Team
//         .find()
//         .exec(function(err, team) {
//             if (!team) {
//                 sendJsonResponse(res, 404, {
//                     "message": "No teams found"
//                 });
//                 return;
//             } else if (err) {
//                 console.log(err)
//                 sendJsonResponse(res, 404, err);
//                 return;
//             }
//             sendJsonResponse(res, 200, team);
//         });
// }


//will get all team-wide phases
var getAllPhasesByTeam = (req, res, callback) => {
    var requestOptions, path;
    console.log('inside getAllItems');
    path = "/getPhaseByTeam";
    requestOptions = {
        url: apiOptions.server + path,
        method: "GET",
        json: {}
    };
    request(
        requestOptions,
        function(err, response, body) {
            var data = body;
            if (response.statusCode === 200) {

                callback(req, res, data);
            } else {
                _showError(req, res, response.statusCode);
            }
        }
    );
}

/**
 * GET /getPhaseByTeam
 * get all phases that are for the whole team
 */
exports.getPhaseByTeam = (req, res) => {


    console.log('getting recent items in exports')
    phases = User.aggregate(
        [{ $unwind: "$phases" },
            { $project: { name: 1, _id: 1, profile: 1, phase_id: "$phases._id", phase_name: "$phases.name", phase_start: "$phases.start", phase_end: "$phases.end", phase_workouts: "$phases.workouts", phase_notes: "$phases.notes", phase_approved: "$phases_approved" } },
            { $sort: { phase_id: 1 } }
        ]).exec(
        function(err, phases) {
            if (!items) {
                sendJsonResponse(res, 404, 'No documents found');
                return;
            } else if (err) {
                sendJsonResponse(res, 400, err)
                return;
            }
            if (items) {
                sendJsonResponse(res, 200, items);
            }
        }
    );
}

exports.allPhases = (req, res) => {
    console.log('inside All phases');
    // console.log(req.params.itemid);
    // console.log(req.params.userid);

    getAllPhasesByTeam(req, res, function(req, res, responseData) {
        //renderAllItems(req, res, responseData);
        console.log('got inside of allPhases export, need to write a renderAllPhasesByTeam page')
    });
}

// Update a phase by Team
module.exports.updatePhaseByTeam = function(req, res) {
    if (!req.params.teamid || !req.params.phaseid) {
        sendJsonResponse(res, 404, {
            "message": "Not found, teamid and phaseid are both required"
        });
        return;
    }
    Team
        .findById(req.params.teamid)
        .select('phases')
        .exec(
            function(err, team) {
                var thisPhase;
                if (!team) {
                    sendJsonResponse(res, 404, {
                        "message": "phaseid not found"
                    });
                    return;
                } else if (err) {
                    sendJsonResponse(res, 400, err);
                    return;
                }
                if (team.phases) {
                    thisPhase = team.phase.id(req.params.phaseid);
                    if (!thisPhase) {
                        sendJsonResponse(res, 404, {
                            "message": "phaseid not found"
                        });
                    } else {
                        // console.log(team);
                        console.log('inside of update item')
                        console.log(req.body)

                        thisPhase.name = req.body.name;
                        thisPhase.start = req.body.start;
                        thisPhase.end = req.body.end;
                        thisPhase.workouts = req.body.workouts;
                        thisPhase.notes = req.body.notes;
                        thisPhase.approved = req.body.approved;

                        team.save(function(err, team) {

                            if (err) {
                                sendJsonResponse(res, 400, err);
                            } else {
                                //console.log(thisPhase);
                                sendJsonResponse(res, 200, thisPhase);
                            }
                        });

                    }
                } else {
                    sendJsonResponse(res, 404, {
                        "message": "No phase to update"
                    });
                }
            }
        );
};

//update a phase by user
module.exports.updatePhaseByUser = function(req, res) {
    if (!req.params.userid || !req.params.phaseid) {
        sendJsonResponse(res, 404, {
            "message": "Not found, userid and phaseid are both required"
        });
        return;
    }
    User
        .findById(req.params.userid)
        .select('athlete.phases')
        .exec(
            function(err, user) {
                var thisPhase;
                if (!user) {
                    sendJsonResponse(res, 404, {
                        "message": "phaseid not found"
                    });
                    return;
                } else if (err) {
                    sendJsonResponse(res, 400, err);
                    return;
                }
                if (user.athlete.phases) {
                    thisPhase = user.athlete.phase.id(req.params.phaseid);
                    if (!thisPhase) {
                        sendJsonResponse(res, 404, {
                            "message": "phaseid not found"
                        });
                    } else {
                        // console.log(team);
                        console.log('inside of update phaseByUser')
                        console.log(req.body)

                        thisPhase.name = req.body.name;
                        thisPhase.start = req.body.start;
                        thisPhase.end = req.body.end;
                        thisPhase.workouts = req.body.workouts;
                        thisPhase.notes = req.body.notes;
                        thisPhase.approved = req.body.approved;

                        user.save(function(err, user) {

                            if (err) {
                                sendJsonResponse(res, 400, err);
                            } else {
                                //console.log(thisPhase);
                                sendJsonResponse(res, 200, thisPhase);
                            }
                        });

                    }
                } else {
                    sendJsonResponse(res, 404, {
                        "message": "No phase to update"
                    });
                }
            }
        );
};