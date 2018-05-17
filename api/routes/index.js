var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/userCtrl');
var teamCtrl = require('../controllers/teamCtrl');
var groupCtrl = require('../controllers/groupCtrl');
var phaseCtrl = require('../controllers/phaseCtrl');



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
router.put('/addUserToTeam/:teamid/:userid', teamCtrl.addUser); // THIS STILL NEEDS TO BE TESTED

// groupCtrl routes
router.get('/getGroup/:groupid', groupCtrl.getGroupById);
router.get('/allGroups', groupCtrl.getAllGroups);
router.post('/createGroup/:teamid', groupCtrl.createGroup);
router.put('/updateGroup/:groupid', groupCtrl.updateGroup);
router.delete('/deleteGroup/:groupid', groupCtrl.deleteGroup);
router.put('/addUserToGroup/:groupid/:userid', groupCtrl.addUser); // THIS STILL NEEDS TO BE TESTED

//phaseCtrl routes
router.get('/getPhase/:phaseid', phaseCtrl.getPhaseById);//needs to be tested
router.get('/allPhaseTeam', phaseCtrl.getPhaseByTeam);//needs to be tested
//router.get('/allPhaseUser', groupCtrl.getAllPhasesByUser);
router.get('/allPhases', phaseCtrl.allPhases);//rendering route, tbd
router.put('/updatePhaseTeam/:phaseid', phaseCtrl.updatePhaseByTeam);//NEEDS TO BE TESTED
router.put('/updatePhaseUser/:phaseid',phaseCtrl.updatePhaseByUser);//NEEDS TO BE TESTED
router.post('/:teamid/phase', phaseCtrl.createPhaseTeam);//TESTED AND PASSED

module.exports = router;