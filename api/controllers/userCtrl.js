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

// Update a user's sets in a workout - PUT
// This function will take a userid, phaseid, workoutid, blockid, exerciseid, and setid as params and the new set in the body
module.exports.updateSet = function(req, res) {
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
                // get the index of the phase that matches the phaseid
                var phase;
                var phaseIndex;
                for(var i = 0; i < user.athlete.phases.length; i++) {
                	if(user.athlete.phases[i]._id == req.params.phaseid) {
                		phase = user.athlete.phases[i];
                		phaseIndex = i;
                	}
                }

                if(phase) {
                	// get the index of the workout that matches the workoutid
                	var workout;
                	var workoutIndex;
                	for(var i = 0; i < phase.workouts.length; i++) {
                		if(phase.workouts[i]._id == req.params.workoutid) {
                			workout = phase.workouts[i];
                			workoutIndex = i;
                		}
                	}

                	if(workout) {
                		// get the index of the block that matches the blockid
                		var block;
                		var blockIndex;
                		for(var i = 0; i < workout.blocks.length; i++) {
                			if(workout.blocks[i]._id == req.params.blockid) {
	                			block = workout.blocks[i];
	                			blockIndex = i;
	                		}
                		}

                		if(block) {
                			// get the index of the exercise that matches the exerciseid
                			var exercise;
                			var exerciseIndex;
                			for(var i = 0; i < block.exercises.length; i++) {
                				if(block.exercises[i]._id == req.params.exerciseid) {
                					exercise = block.exercises[i]
                					exerciseIndex = i;
                				}
                			}

                			if(exercise) {
                				// find the set that matches the id and set it equal to the new set
                				var setIndex;
                				for(var i = 0; i < exercise.sets.length; i++) {
                					if(exercise.sets[i]._id == req.params.setid) {
                						setIndex = i;
                					}
                				}

                				console.log(setIndex);

                				if(setIndex > -1) {
                					// use the index's to reference the real set object in the user
                					// update all of the set information except the ObjectId
                					user.athlete.phases[phaseIndex].workouts[workoutIndex].blocks[blockIndex].exercises[exerciseIndex].sets[setIndex].setnumber = req.body.setnumber;
                					user.athlete.phases[phaseIndex].workouts[workoutIndex].blocks[blockIndex].exercises[exerciseIndex].sets[setIndex].reps = req.body.reps;
                					user.athlete.phases[phaseIndex].workouts[workoutIndex].blocks[blockIndex].exercises[exerciseIndex].sets[setIndex].percent = req.body.percent;
                					user.athlete.phases[phaseIndex].workouts[workoutIndex].blocks[blockIndex].exercises[exerciseIndex].sets[setIndex].calcweight = req.body.calcweight;
                					user.athlete.phases[phaseIndex].workouts[workoutIndex].blocks[blockIndex].exercises[exerciseIndex].sets[setIndex].actweight = req.body.actweight;

                					user.save((err) => {
								      	if (err) {
								        	return err;
								      	}
								      	sendJsonResponse(res, 200, user);
								      	console.log('User set information was updated');
								    });
                				} else {
                					console.log('no sets have the specified setid');
				                	sendJsonResponse(res, 404, {
							            "message": "no sets have the specified setid"
							        });
                				}

                			} else {
                				console.log('no exercises have the specified exerciseid');
			                	sendJsonResponse(res, 404, {
						            "message": "no exercises have the specified exerciseid"
						        });
                			}

                		} else {
                			console.log('no blocks have the specified blockid');
		                	sendJsonResponse(res, 404, {
					            "message": "no blocks have the specified blockid"
					        });
                		}

                	} else {
                		console.log('no workouts have the specified workoutid');
	                	sendJsonResponse(res, 404, {
				            "message": "no workouts have the specified workoutid"
				        });
                	}

                } else {
                	console.log('no phases have the specified phaseid');
                	sendJsonResponse(res, 404, {
			            "message": "no phases have the specified phaseid"
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







