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

// // Add a exercise to a workout - PUT
// // passed the workoutid, blockid in params and exercise in the body
// module.exports.addExercise = function(req, res) {
// 	console.log('adding exercise to workout');
// 	if(req.params && req.params.workoutid && req.params.blockid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
//                 if (!workout) {
//                     sendJsonResponse(res, 404, {
//                         "message": "workoutid not found"
//                     });
//                     return;
//                 } else if (err) {
//                     console.log(err)
//                     sendJsonResponse(res, 404, err);
//                     return;
//                 }
//                 Block
//                 	.findById(req.params.blockid)
//                 	.exec(function(err, block) {
// 	                if (!block) {
// 	                    sendJsonResponse(res, 404, {
// 	                        "message": "blockid not found"
// 	                    });
// 	                    return;
// 	                } else if (err) {
// 	                    console.log(err)
// 	                    sendJsonResponse(res, 404, err);
// 	                    return;
// 	                }
// 	                newExerciseArr = block.exercises.concat([req.body.exercise])
// 	                block.exercise = newExerciseArr
// 	                block.save((err) => {
// 				      	if (err) {
// 				        	return err;
// 				      	}
// 				      	sendJsonResponse(res, 200, block);
// 				      	console.log('Exercise was added');
// 				    });
//             });
// 		});	
// 	} else {
// 		console.log('No workoutid or blockid specified');
//         sendJsonResponse(res, 404, {
//             "message": "No workoutid or blockid in request"
//         });
// 	}
// }

// // Create workout - POST
// // phaseid should be a param, the workout is passed through the body
// module.exports.createWorkout = function(req, res) {
// 	const workout = new Workout({
// 		name: req.body.name,
// 		blocks: req.body.blocks,
// 		time: req.body.time,
// 		trainingnotes: req.body.trainingnotes,
// 		athletenotes: req.body.athletenotes
//     });

//     workout.save((err) => {
//     	if (err) {
//     		sendJsonResponse(res, 404, err);
//     		return err;
//     	} 
//     })

//     // Get the phase and add the new workout to it
//     if (req.params && req.params.phaseid) {
//         Phase
//             .findById(req.params.phaseid)
//             .exec(function(err, phase) {
//                 if (!phase) {
//                     sendJsonResponse(res, 404, {
//                         "message": "phaseid not found"
//                     });
//                     return;
//                 } else if (err) {
//                     console.log(err)
//                     sendJsonResponse(res, 404, err);
//                     return;
//                 }
//                 newPhaseWorkout = team.groups.concat(phase);
//                 phase.workouts = newPhaseWorkout;
//                 team.save((err) => {
// 			      	if (err) {
// 			      		sendJsonResponse(res, 404, err);
// 			        	return;
// 			      	}
// 			      	sendJsonResponse(res, 200, phase);
// 			      	console.log('The new workout has been added to the phase');
// 			    });
//             });
//     } else {
//         console.log('No phaseid specified');
//         sendJsonResponse(res, 404, {
//             "message": "No phaseid in request"
//         });
//     }
// }

// // Get workout - GET
// // workout id passed as a param
// module.exports.getWorkout = function(req, res) {
// 	if(req.params && req.params.workoutid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
//                 if (!workout) {
//                     sendJsonResponse(res, 404, {
//                         "message": "workoutid not found"
//                     });
//                     return;
//                 } else if (err) {
//                     console.log(err)
//                     sendJsonResponse(res, 404, err);
//                     return;
//                 }
//                 sendJsonResponse(res, 200, workout);
//             });
// 	} else {
// 		console.log('No workoutid specified');
//         sendJsonResponse(res, 404, {
//             "message": "No workoutid in request"
//         });
// 	}
// }

// // Get all workouts - GET
// // nothing passed into this function, just the workouts are returned
// module.exports.getAllWorkouts = function(req, res) {
// 	Workout
// 		.find()
// 		.exec(function(err, workout) {
//             if (!workout) {
//                 sendJsonResponse(res, 404, {
//                     "message": "no workouts found"
//                 });
//                 return;
//             } else if (err) {
//                 console.log(err)
//                 sendJsonResponse(res, 404, err);
//                 return;
//             }
//             sendJsonResponse(res, 200, workout);
//         });
// }

// // Get all blocks from a specific workoutid - GET
// // the workoutid will be passed as a param, the an array of blocks is returned
// module.exports.getAllBlocks = function(req, res) {
// 	if(req.params && req.params.workoutid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
// 	            if (!workout) {
// 	                sendJsonResponse(res, 404, {
// 	                    "message": "no workouts found"
// 	                });
// 	                return;
// 	            } else if (err) {
// 	                console.log(err)
// 	                sendJsonResponse(res, 404, err);
// 	                return;
// 	            }
// 	            blocks = workout.blocks
// 	            if(blocks) {
// 					sendJsonResponse(res, 200, blocks);
// 	            } else {
// 	            	sendJsonResponse(res, 404, {
// 	            		"message": "No blocks found in the workout"
// 	            	})
// 	            }
	            
// 	        });

// 	} else {
// 		console.log('No workoutid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No workoutid were in request"
//         });
// 	}
// }

// // Get a specific block based on workoutid and blockid
// // the workoutid and blockid will be passed as params, one block is returned
// module.exports.getBlock = function(req, res) {
// 	if(req.params && req.params.workoutid && req.params.blockid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
// 	            if (!workout) {
// 	                sendJsonResponse(res, 404, {
// 	                    "message": "no workouts found"
// 	                });
// 	                return;
// 	            } else if (err) {
// 	                console.log(err)
// 	                sendJsonResponse(res, 404, err);
// 	                return;
// 	            }

// 	            blocks = workout.blocks
// 	            blockToReturn;
// 	            // find the block that matches the passed blockid
// 	            for(var i = 0; i < blocks.length; i++) {
// 	            	if(blocks[i]._id == req.params.blockid) {
// 	            		blockToReturn = blocks[i]
// 	            	}
// 	            }
// 	            if(blockToReturn) {
// 					sendJsonResponse(res, 200, blockToReturn);
// 	            } else {
// 	            	sendJsonResponse(res, 404, {
// 	            		"message": "No blocks found in the workout with the specified blockid"
// 	            	})
// 	            }
	            
// 	        });
// 	} else {
// 		console.log('No workoutid or blockid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No blockid or workoutid were in request"
//         });
// 	}
// }

// // Get all exercises for a specific block in a workout - GET
// // The workoutid and blockid will be passed as params, an array of exercises will be returned
// module.exports.getAllExercises = function(req, res) {
// 	if(req.params && req.params.workoutid && req.params.blockid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
// 	            if (!workout) {
// 	                sendJsonResponse(res, 404, {
// 	                    "message": "no workouts found"
// 	                });
// 	                return;
// 	            } else if (err) {
// 	                console.log(err)
// 	                sendJsonResponse(res, 404, err);
// 	                return;
// 	            }

// 	            blocks = workout.blocks
// 	            blockToReturn;
// 	            // find the block that matches the passed blockid
// 	            for(var i = 0; i < blocks.length; i++) {
// 	            	if(blocks[i]._id == req.params.blockid) {
// 	            		blockToReturn = blocks[i]
// 	            	}
// 	            }
// 	            if(blockToReturn) {
// 	            	exercisesToReturn = blockToReturn.exercises;
// 					sendJsonResponse(res, 200, exercisesToReturn);
// 	            } else {
// 	            	sendJsonResponse(res, 404, {
// 	            		"message": "No blocks found in the workout with the specified blockid"
// 	            	})
// 	            }
	            
// 	        });
// 	} else {
// 		console.log('No workoutid or blockid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No blockid or workoutid were in request"
//         });
// 	}
// }

// // Get exercise based on workoutid, blockid, exerciseid - GET
// // The workoutid, blockid, and exerciseid should be passed as params, an exercise object should be returned
// module.exports.getExercise = function(req, res) {
// 	if(req.params && req.params.workoutid && req.params.blockid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
// 	            if (!workout) {
// 	                sendJsonResponse(res, 404, {
// 	                    "message": "no workouts found"
// 	                });
// 	                return;
// 	            } else if (err) {
// 	                console.log(err)
// 	                sendJsonResponse(res, 404, err);
// 	                return;
// 	            }

// 	            blocks = workout.blocks
// 	            blockToReturn;
// 	            // find the block that matches the passed blockid
// 	            for(var i = 0; i < blocks.length; i++) {
// 	            	if(blocks[i]._id == req.params.blockid) {
// 	            		blockToReturn = blocks[i]
// 	            	}
// 	            }
// 	            if(blockToReturn) {
// 	            	exerciseToReturn;
// 	            	for(var i = 0; i < blockToReturn.exercises.length; i++) {
// 	            		if(blockToReturn.exercises[i]._id == exerciseid) {
// 	            			exerciseToReturn = blockToReturn.exercises[i];
// 	            		}
// 	            	}
// 	            	if(exerciseToReturn) {
// 	            		sendJsonResponse(res, 200, exerciseToReturn);
// 	            	} else {
// 	            		sendJsonResponse(res, 404, {
// 		            		"message": "No exercises found in the workout with the specified exerciseid"
// 		            	})
// 	            	}
					
// 	            } else {
// 	            	sendJsonResponse(res, 404, {
// 	            		"message": "No blocks found in the workout with the specified blockid"
// 	            	})
// 	            }
	            
// 	        });
// 	} else {
// 		console.log('No workoutid or blockid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No blockid or workoutid were in request"
//         });
// 	}
// }

// // Get all the sets for an exercise based on the workoutid, and blockid - GET
// // An array of set objects for a specific exercise within a workout will be returned.
// module.exports.getAllSets = function(req, res) {
// 	if(req.params && req.params.workoutid && req.params.blockid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
// 	            if (!workout) {
// 	                sendJsonResponse(res, 404, {
// 	                    "message": "no workouts found"
// 	                });
// 	                return;
// 	            } else if (err) {
// 	                console.log(err)
// 	                sendJsonResponse(res, 404, err);
// 	                return;
// 	            }

// 	            blocks = workout.blocks
// 	            block;
// 	            // find the block that matches the passed blockid
// 	            for(var i = 0; i < blocks.length; i++) {
// 	            	if(blocks[i]._id == req.params.blockid) {
// 	            		block = blocks[i]
// 	            	}
// 	            }
// 	            if(block) {
// 	            	exercise;
// 	            	for(var i = 0; i < block.exercises.length; i++) {
// 	            		if(block.exercises[i]._id == exerciseid) {
// 	            			exercise = block.exercises[i];
// 	            		}
// 	            	}
// 	            	if(exercise) {
// 	            		sets = exercise.sets;
// 	            		if(sets) {
// 							sendJsonResponse(res, 200, sets);
// 	            		} else {
// 	            			sendJsonResponse(res, 404, {
// 	            				"message": "No sets were found in the exercise"
// 	            			})
// 	            		}
	            		
// 	            	} else {
// 	            		sendJsonResponse(res, 404, {
// 		            		"message": "No exercises were found in the block"
// 		            	})
// 	            	}
					
// 	            } else {
// 	            	sendJsonResponse(res, 404, {
// 	            		"message": "No blocks found in the workout with the specified blockid"
// 	            	})
// 	            }
	            
// 	        });
// 	} else {
// 		console.log('No workoutid or blockid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No blockid or workoutid were in request"
//         });
// 	}
// }


// // Get a specific sets for an exercise based on the workoutid, blockid, exerciseid, and setid - GET
// // A set object will be returned.
// module.exports.getSet = function(req, res) {
// 	if(req.params && req.params.workoutid && req.params.blockid && req.params.exerciseid) {
// 		Workout
// 			.findById(req.params.workoutid)
// 			.exec(function(err, workout) {
// 	            if (!workout) {
// 	                sendJsonResponse(res, 404, {
// 	                    "message": "no workouts found"
// 	                });
// 	                return;
// 	            } else if (err) {
// 	                console.log(err)
// 	                sendJsonResponse(res, 404, err);
// 	                return;
// 	            }

// 	            blocks = workout.blocks
// 	            block;
// 	            // find the block that matches the passed blockid
// 	            for(var i = 0; i < blocks.length; i++) {
// 	            	if(blocks[i]._id == req.params.blockid) {
// 	            		block = blocks[i]
// 	            	}
// 	            }
// 	            if(block) {
// 	            	exercise;
// 	            	for(var i = 0; i < block.exercises.length; i++) {
// 	            		if(block.exercises[i]._id == exerciseid) {
// 	            			exercise = block.exercises[i];
// 	            		}
// 	            	}
// 	            	if(exercise) {
// 	            		sets = exercise.sets;
// 	            		setToReturn;
// 	            		for(var i = 0; i < sets.length; i++) {
// 	            			if(sets[i]._id == setid) {
// 	            				setToReturn = sets[i]
// 	            			}
// 	            		}
// 	            		if(setToReturn) {
// 							sendJsonResponse(res, 200, setToReturn);
// 	            		} else {
// 	            			sendJsonResponse(res, 404, {
// 	            				"message": "No sets were found in the block with the specified setid"
// 	            			})
// 	            		}
	            		
// 	            	} else {
// 	            		sendJsonResponse(res, 404, {
// 		            		"message": "No exercises were found in the block"
// 		            	})
// 	            	}
					
// 	            } else {
// 	            	sendJsonResponse(res, 404, {
// 	            		"message": "No blocks found in the workout with the specified blockid"
// 	            	})
// 	            }
	            
// 	        });
// 	} else {
// 		console.log('No workoutid or blockid were specified');
//         sendJsonResponse(res, 404, {
//             "message": "No blockid or workoutid were in request"
//         });
// 	}
// }

// Update the set for an exercise based on the workoutid, blockid, and exerciseid, and setid - PUT
// This function will get a set based on a workoutid, blockid, exerciseid, and setid, then update the set.








