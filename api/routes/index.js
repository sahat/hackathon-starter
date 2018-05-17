var express = require('express');
var router = express.Router();
var userCtrl = require('../controllers/userCtrl');
var teamCtrl = require('../controllers/teamCtrl');

// userCtrl routes
router.get('/user/:userid', userCtrl.getUserById);
router.get('/allUsers', userCtrl.getAllUsers);

// teamCtrl routes
router.get('/team/:teamid', teamCtrl.getTeamById);
router.post('/createTeam', teamCtrl.createTeam);
router.get('/allTeams', teamCtrl.getAllTeams);
router.put('/updateTeam', teamCtrl.updateTeam);


module.exports = router;