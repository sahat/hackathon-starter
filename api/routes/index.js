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
router.get('/allWorkouts/:userid', userCtrl.getAllWorkouts);
router.get('/workout/:userid/:workoutid', userCtrl.getWorkout);

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
router.put('/addUserToGroup/:groupid/:userid', groupCtrl.addUser);

//phaseCtrl routes

router.get('/allPhaseTeam', phaseCtrl.getPhasesByTeam);//needs to be tested
router.get('/allPhases', phaseCtrl.allPhases);//rendering route, tbd
router.put('/updatePhaseTeam/:phaseid', phaseCtrl.updatePhaseByTeam);//additional functionality if time allows
router.put('/updatePhaseUser/:phaseid',phaseCtrl.updatePhaseByUser);//additional functionality if time allows
router.post('/:teamid/phase', phaseCtrl.createPhaseTeam);//works as intended
router.post('/:groupid/phase', phaseCtrl.createPhaseGroup)//needs to be written and tested

// workoutCtrl routes
router.put('/addExercise/:workoutid/:blockid', workoutCtrl.addExercise);
router.post('/createWorkout/:phaseid', workoutCtrl.createWorkout);
router.get('/getWorkout/:workoutid', workoutCtrl.getWorkout);
router.get('/allWorkouts', workoutCtrl.getAllWorkouts);

module.exports = router;