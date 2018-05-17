// controller file for users
var mongoose = require('mongoose');
var User = mongoose.model('User');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

// Get a user by id - GET
module.exports.getUserById = function(req, res) {
    console.log('reading one user');
    console.log('Finding user details', req.params);
    if (req.params && req.params.userid) {
        User
            .findById(req.params.userid)
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
                sendJsonResponse(res, 200, user);
            });
    } else {
        console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
    }
};

// Get all users - GET
module.exports.getAllUsers = function(req, res) {
    console.log('reading all users');
    User
        .find() // finds all the users
        .exec(function(err, user) {
            if (!user) {
                sendJsonResponse(res, 404, {
                    "message": "no users found"
                });
                return;
            } else if (err) {
                console.log(err)
                sendJsonResponse(res, 404, err);
                return;
            }
            sendJsonResponse(res, 200, user);
        });
};

// Add a phase to a user - PUT
module.exports.addPhase = function(req, res) {
	console.log('adding a phase to a user');
	if (req.params && req.params.userid) {
		User
            .findById(req.params.userid)
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
                console.log(user.athlete)
                allPhases = user.athlete.phases.concat(req.body.athlete.phases);
                user.athlete.phases = allPhases
                user.save((err) => {
			      	if (err) {
			        	return err;
			      	}
			      	sendJsonResponse(res, 200, user);
			      	console.log('User phase information was updated');
			    });
            });
	} else {
		console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
	}
}

// Delete a phase from a user - PUT
module.exports.deletePhase = function(req, res) {
	console.log('deleting phase from user');
	if(req.params && req.params.userid && req.params.phaseid) {
		// Get the user by userid
		User
            .findById(req.params.userid)
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
                var phases = user.athlete.phases;
                var phaseToRemove;
                // find all phases except the one to delete and add to an array
                for(var i = 0; i < phases.length; i++) {
                	if (phases[i]._id == req.params.phaseid) {
                		phaseToRemove = phases[i];
                	}
                }

                if (phaseToRemove) {
                	console.log('in phases to remove');
                	// remove the phaseToRemove from phases array
                	var index = phases.indexOf(phaseToRemove);
					if (index > -1) {
					  phases.splice(index, 1);
					}
                	user.athlete.phases = phases
	                user.save((err) => {
				      	if (err) {
				        	return err;
				      	}
				      	sendJsonResponse(res, 200, user);
				      	console.log('Phase was deleted from the user');
				    });
                }
            });

	} else {
		console.log('No userid specified')
		sendJsonResponse(res, 404, {
			"message":"No userid in request"
		})
	}
}

// Get all Phases for a user - GET
module.exports.getAllPhases = function(req, res) {
	console.log('Getting phases for one user')
	if (req.params && req.params.userid) {
        User
            .findById(req.params.userid)
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
                var phases = user.athlete.phases;
                sendJsonResponse(res, 200, phases);
            });
    } else {
        console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
    }
}

// Get all Workouts for a user - GET
module.exports.getAllWorkouts = function(req, res) {
	console.log('getting all workouts for a user')
	if (req.params && req.params.userid) {
        User
            .findById(req.params.userid)
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
                var phases = user.athlete.phases;
                var workouts = [];
                for(var i = 0; i < phases.length; i++) {
                	for(var j = 0; j < phases[i].workouts.length; j++) {
                		workouts.push(phases[i].workouts[j]);
                	}
                }
                sendJsonResponse(res, 200, workouts);
            });
    } else {
        console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
    }
}

// Get a workout from userid and workoutid - GET
module.exports.getWorkout = function(req, res) {
	console.log('getting one workout') 
	if (req.params && req.params.userid && req.params.workoutid) {
        User
            .findById(req.params.userid)
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
                var phases = user.athlete.phases;
                var workoutToReturn;
                for(var i = 0; i < phases.length; i++) {
                	for(var j = 0; j < phases[i].workouts.length; j++) {
                		if(phases[i].workouts[j]._id == req.params.workoutid) {
                			workoutToReturn = phases[i].workouts[j];
                		}
                	}
                }
                if(workoutToReturn) {
                	console.log('found the workout!')
                	sendJsonResponse(res, 200, workoutToReturn);
                } else {
                	console.log('No workout with that workoutid exists');
			        sendJsonResponse(res, 404, {
			            "message": "No workout with the specified workoutid exists"
			        });
                }
            });
    } else {
        console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
    }
}







