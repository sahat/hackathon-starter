var express = require('express');
var router = express.Router();


// define API v1
router.use('/v1', require('./v1'));

module.exports = router;