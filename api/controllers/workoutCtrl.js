var mongoose = require('mongoose');
var ExerciseWithReps = mongoose.model('ExerciseWithReps');
var SetSchema = mongoose.model('Set');
var Block = mongoose.model('Block');
var Workout = mongoose.model('Workout');
var Phase = mongoose.model('Phase');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

// Add a exercise to a workout - PUT
// passed the workoutid, blockid in params and exercise in the body
module.exports.addExercise = function(req, res) {
	console.log('adding exercise to workout');
	if(req.params && req.params.workoutid && req.params.blockid) {
		Workout
			.findById(req.params.workoutid)
			.exec(function(err, workout) {
                if (!workout) {
                    sendJsonResponse(res, 404, {
                        "message": "workoutid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                Block
                	.findById(req.params.blockid)
                	.exec(function(err, block) {
	                if (!block) {
	                    sendJsonResponse(res, 404, {
	                        "message": "blockid not found"
	                    });
	                    return;
	                } else if (err) {
	                    console.log(err)
	                    sendJsonResponse(res, 404, err);
	                    return;
	                }
	                newExerciseArr = block.exercises.concat([req.body.exercise])
	                block.exercise = newExerciseArr
	                block.save((err) => {
				      	if (err) {
				        	return err;
				      	}
				      	sendJsonResponse(res, 200, block);
				      	console.log('Exercise was added');
				    });
            });
		});	
	} else {
		console.log('No workoutid or blockid specified');
        sendJsonResponse(res, 404, {
            "message": "No workoutid or blockid in request"
        });
	}
}

// Create workout - POST
// phaseid should be a param, the workout is passed through the body
module.exports.createWorkout = function(req, res) {
	const workout = new Workout({
    	const workoutSchema = new mongoose.Schema({
  			name: req.body.name,
  			blocks: req.body.blocks,
  			time: req.body.time,
  			trainingnotes: req.body.trainingnotes,
  			athletenotes: req.body.athletenotes
 		});
    });

    workout.save((err) => {
    	if (err) {
    		sendJsonResponse(res, 404, err);
    		return err;
    	} 
    })

    // Get the phase and add the new workout to it
    if (req.params && req.params.phaseid) {
        Phase
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
                newPhaseWorkout = team.groups.concat(phase);
                phase.workouts = newPhaseWorkout;
                team.save((err) => {
			      	if (err) {
			      		sendJsonResponse(res, 404, err);
			        	return;
			      	}
			      	sendJsonResponse(res, 200, phase);
			      	console.log('The new workout has been added to the phase');
			    });
            });
    } else {
        console.log('No phaseid specified');
        sendJsonResponse(res, 404, {
            "message": "No phaseid in request"
        });
    }
}

// Get workout - GET
// workout id passed as a param
module.exports.getWorkout = function(req, res) {
	if(req.params && req.params.workoutid) {
		Workout
			.findById(req.params.workoutid)
			.exec(function(err, workout) {
                if (!workout) {
                    sendJsonResponse(res, 404, {
                        "message": "workoutid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                sendJsonResponse(res, 200, workout);
            });
	} else {
		console.log('No workoutid specified');
        sendJsonResponse(res, 404, {
            "message": "No workoutid in request"
        });
	}
}

// Get all workouts - GET
// nothing passed into this function, just the workouts are returned
module.exports.getAllWorkouts = function(req, res) {
	Workout
		.find()
		.exec(function(err, workout) {
            if (!workout) {
                sendJsonResponse(res, 404, {
                    "message": "no workouts found"
                });
                return;
            } else if (err) {
                console.log(err)
                sendJsonResponse(res, 404, err);
                return;
            }
            sendJsonResponse(res, 200, workout);
        });
}

// Get block - GET
// the workoutid and blockid will be passed as a param, the block is returned
// module.exports.getBlock = function(req, res) {
// 	if(req.params && req.params.workoutid && req.params.blockid) {
// 		Workout
// 			.findById(req.params.workoutid)
			

// 	} else {
// 		console.log('No blockid or workoutid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No blockid or workoutid were in request"
//         });
// 	}
// }









