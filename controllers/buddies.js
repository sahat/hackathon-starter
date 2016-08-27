var User = require('../models/User');

/**
 * GET /buddies
 *
 */

exports.main = function(req, res){
  res.render('buddies/mybuddies', {
    title: 'My Buddies'
  });
};