var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/userCtrl');
var teamCtrl = require('../controllers/teamCtrl');
var groupCtrl = require('../controllers/groupCtrl');
var phaseCtrl = require('../controllers/phaseCtrl');
var workoutCtrl = require('../controllers/workoutCtrl');



// userCtrl routes
router.get('/getUser/:userid', userCtrl.getUserById);
router.get('/allUsers', userCtrl.getAllUsers);
router.put('/addPhase/:userid', userCtrl.addPhase);
router.put('/deletePhase/:userid/:phaseid', userCtrl.deletePhase);
router.get('/allPhases/:userid', userCtrl.getAllPhases);
// router.get('/allWorkouts/:userid', userCtrl.getAllWorkouts);
// router.get('/workout/:userid/:workoutid', userCtrl.getWorkout);
//router.put('/updateSet/:userid/:phaseid/:workoutid/:blockid/:exerciseid/:setid', userCtrl.updateSet)


// teamCtrl routes
router.get('/getTeam/:teamid', teamCtrl.getTeamById);
router.post('/createTeam', teamCtrl.createTeam);
router.get('/allTeams', teamCtrl.getAllTeams);
router.put('/updateTeam/:teamid', teamCtrl.updateTeam);
router.put('/addUserToTeam/:teamid/:userid', teamCtrl.addUser);

// groupCtrl routes
router.get('/getGroup/:groupid', groupCtrl.getGroupById);
router.get('/allGroups', groupCtrl.getAllGroups);
router.post('/createGroup/:teamid', groupCtrl.createGroup);
router.put('/updateGroup/:groupid', groupCtrl.updateGroup);
router.delete('/deleteGroup/:groupid', groupCtrl.deleteGroup);
router.put('/addUserToGroup/:teamid/:groupid/:userid', groupCtrl.addUser);

//phaseCtrl routes
//router.get('/getPhaseTeam/:teamid/:userid', phaseCtrl.getAthletePhaseByIdTeam);//needs to be tested
router.get('/allPhasesTeam/:teamid', phaseCtrl.getPhasesByTeam);//needs to be written
router.get('/allPhasesGroup/:teamid/:groupid', phaseCtrl.getPhasesByGroup);
router.post('/:teamid/phase', phaseCtrl.createPhaseTeam);//works as intended
router.post('/:teamid/:groupid/phase', phaseCtrl.createPhaseGroup);

// workoutCtrl routes
// //router.put('/addExercise/:workoutid/:blockid', workoutCtrl.addExercise);
// router.post('/createWorkout/:phaseid', workoutCtrl.createWorkout);
// router.get('/getWorkout/:workoutid', workoutCtrl.getWorkout);
// router.get('/allWorkouts', workoutCtrl.getAllWorkouts);
//router.get('/allBlocks/:workoutid', workoutCtrl.getAllBlocks);


module.exports = router;