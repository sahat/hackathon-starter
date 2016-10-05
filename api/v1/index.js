var express = require('express');
var router = express.Router();

// Define buddies API
router.use('/buddies', require('./buddies'));

// Update details
router.use('/update', require('./update'));

// Get and respond to invites
router.use('/invites', require('./invites'));

// Get public user info
router.use('/user', require('./user'));

module.exports = router;