var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/userCtrl');
var teamCtrl = require('../controllers/teamCtrl');
var groupCtrl = require('../controllers/groupCtrl');
var phaseCtrl = require('../controllers/phaseCtrl');

// userCtrl routes
router.get('/getUser/:userid', userCtrl.getUserById);
router.get('/allUsers', userCtrl.getAllUsers);

// teamCtrl routes
router.get('/getTeam/:teamid', teamCtrl.getTeamById);
router.post('/createTeam', teamCtrl.createTeam);
router.get('/allTeams', teamCtrl.getAllTeams);
router.put('/updateTeam/:teamid', teamCtrl.updateTeam);

// groupCtrl routes
router.get('/getGroup/:groupid', groupCtrl.getGroupById);
router.get('/allGroups', groupCtrl.getAllGroups);
router.post('/createGroup', groupCtrl.createGroup);
router.put('/updateGroup/:groupid', groupCtrl.updateGroup);
router.delete('/deleteGroup/:groupid', groupCtrl.deleteGroup);

//phaseCtrl routes
router.get('/getPhase/:phaseid', phaseCtrl.getPhaseById);
router.get('/allPhaseTeam', phaseCtrl.getPhaseByTeam);
//router.get('/allPhaseUser', groupCtrl.getAllPhasesByUser);
router.get('/allPhases', phaseCtrl.allPhases);
router.put('/updatePhaseTeam/:phaseid', phaseCtrl.updatePhaseByTeam);
router.put('/updatePhaseUser/:phaseid',phaseCtrl.updatePhaseByUser);
router.post('/:teamid/phase', phaseCtrl.createPhaseTeam)

module.exports = router;