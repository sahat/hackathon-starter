var express = require('express');
var router = express.Router();

// Define buddies API
router.use('/buddies', require('./buddies'));

// Update details
router.use('/update', require('./update'));

module.exports = router;