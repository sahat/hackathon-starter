var mongoose = require('mongoose');
var Workout = mongoose.model('Workout');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};
// const workoutSchema = new mongoose.Schema({
//   name: {type: String, require: true},
//   blocks: [blockSchema],
//   time: {type: Date, require: true},
//   trainingnotes: String,
//   athletenotes: String
//  });

// getAllWorkouts - GET *
// createWorkout - POST *
// getWorkoutById - GET *
// getWorkoutByUser - GET -- this should be in the userCtrl
// updateWorkoutByUser - PUT -- This can be achieved by updating a user with an updated workout
// deleteWorkout - DELETE
// updateWorkout - PUT

// Create a new workout - POST
// module.exports.createWorkout = function(req, res) {
// 	console.log('creating new workout');
//     const workout = new Workout({
//     	name: req.body.name,
// 		blocks: req.body.blocks,
// 		time: req.body.time,
// 		trainingnotes: req.body.trainingnotes,
// 		athletenotes: req.body.athletenotes
//     });

//     workout.save((err) => {
//     	if (err) {
//     		sendJsonResponse(res, 404, err);
//     		return next(err);
//     	} else {
//     		sendJsonResponse(res, 200, workout);
//     		console.log('team successfully added')
//     	}
//     })
// };

// // Get a workout by ID - GET
// module.exports.getWorkoutById = function(req, res) {
// 	console.log('reading one workout');
//     console.log('Finding workout details', req.params);
//     if (req.params && req.params.workoutid) {
//         Workout
//             .findById(req.params.workoutid)
//             .exec(function(err, workout) {
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
//     } else {
//         console.log('No workoutid specified');
//         sendJsonResponse(res, 404, {
//             "message": "No workoutid in request"
//         });
//     }
// }

// // Get all workouts - GET
// module.exports.getAllWorkouts = function(req, res) {
// 	console.log('reading all workouts');
//     Workout
//         .find()
//         .exec(function(err, workout) {
//             if (!workout) {
//                 sendJsonResponse(res, 404, {
//                     "message": "no workouts were found"
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

// // Update a workout by ID - PUT
// module.exports.updateWorkout = function(req, res) {
//  	if (req.params && req.params.workoutid) {
//  		Workout
//             .findById(req.params.groupid)
//             .exec(function(err, group) {
//                 if (!group) {
//                     sendJsonResponse(res, 404, {
//                         "message": "groupid not found"
//                     });
//                     return;
//                 } else if (err) {
//                     console.log(err)
//                     sendJsonResponse(res, 404, err);
//                     return;
//                 }
//                 group.name = req.body.name;
// 			    group.athletes = req.body.athletes;
// 			    group.save((err) => {
// 			      	if (err) {
// 			        	return next(err);
// 			      	}
// 			      	req.flash('success', { msg: 'Group information has been updated.' });
// 			      	console.log('group information was updated');
// 			    });
//                 sendJsonResponse(res, 200, group);
//             });
//  	} else {
//  		console.log('No groupid specified');
//         sendJsonResponse(res, 404, {
//             "message": "No groupid in request"
//         });
//  	}  
// }


