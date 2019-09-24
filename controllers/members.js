/**
 * GET /
 * Members page.
 */
const _ = require('lodash');
const User = require('../models/User');

exports.index = async (req, res) => {
  const allUsers = await User.find({});

  let currentUser;
  let profileKeys = [];

  if (req.params.id) {
    currentUser = await User.findOne({ _id: req.params.id });
    delete currentUser.password;
    if (currentUser.profile) { delete currentUser.profile.$init; }
    profileKeys = currentUser.profile && Object.keys(currentUser.profile).filter((k) => k !== 'picture')
      .map((k) => _.capitalize(k));
  }

  const variables = {
    title: 'Members',
    users: allUsers.map((u) => {
      delete u.password;
      return u;
    }).filter((u) => !u.private),
    currentUser,
    profileKeys
  };

  res.render('members/index', {
    ...variables
  });
};
