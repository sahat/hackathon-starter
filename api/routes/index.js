var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/userCtrl');
var teamCtrl = require('../controllers/teamCtrl');
var groupCtrl = require('../controllers/groupCtrl');

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


module.exports = router;