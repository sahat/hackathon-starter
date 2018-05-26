var mongoose = require('mongoose');
var Group = mongoose.model('Group');
var Team = mongoose.model('Team');
var User = mongoose.model('User');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

// Create a new group - POST -DONE 
module.exports.createGroup = function(req, res) {
    console.log('creating new group');
    const group = new Group({
        name: req.body.name,
        athletes: req.body.athletes
    });

    //not necessary
    // group.save((err) => {
    //  if (err) {
    //         console.log("error returned on line 23")
    //      sendJsonResponse(res, 404, err);
    //      return err;
    //  } 
    // })

    // Get the team and add the new group to it
    if (req.params && req.params.teamid) {
        Team
            .findById(req.params.teamid)
            .exec(function(err, team) {
                if (!team) {
                    sendJsonResponse(res, 404, {
                        "message": "teamid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }

                team.groups.push(group);
                console.log(team);
                team.save((err) => {
                    if (err) {
                        sendJsonResponse(res, 404, err);
                        return;
                    }
                    sendJsonResponse(res, 200, team);
                    console.log('The new group has been added to the team');
                });
            });
    } else {
        console.log('No groupid specified');
        sendJsonResponse(res, 404, {
            "message": "No groupid in request"
        });
    }
};

// Get a group by ID - GET
module.exports.getGroupById = function(req, res) {
    console.log('reading one group');
    console.log('Finding group details', req.params);
    if (req.params && req.params.groupid) {
        Group
            .findById(req.params.groupid)
            .exec(function(err, group) {
                if (!group) {
                    sendJsonResponse(res, 404, {
                        "message": "groupid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                sendJsonResponse(res, 200, group);
            });
    } else {
        console.log('No groupid specified');
        sendJsonResponse(res, 404, {
            "message": "No groupid in request"
        });
    }
}

// Get all groups - GET
module.exports.getAllGroups = function(req, res) {
    console.log('getting all groups');
    Group
        .find()
        .exec(function(err, group) {
            if (!group) {
                sendJsonResponse(res, 404, {
                    "message": "No grous found"
                });
                return;
            } else if (err) {
                console.log(err)
                sendJsonResponse(res, 404, err);
                return;
            }
            sendJsonResponse(res, 200, group);
        });
}

// Update a group by ID - PUT
module.exports.updateGroup = function(req, res) {
    if (req.params && req.params.groupid) {
        Group
            .findById(req.params.groupid)
            .exec(function(err, group) {
                if (!group) {
                    sendJsonResponse(res, 404, {
                        "message": "groupid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                group.name = req.body.name;
                group.athletes = req.body.athletes;
                group.save((err) => {
                    if (err) {
                        return next(err);
                    }
                    req.flash('success', { msg: 'Group information has been updated.' });
                    console.log('group information was updated');
                });
                sendJsonResponse(res, 200, group);
            });
    } else {
        console.log('No groupid specified');
        sendJsonResponse(res, 404, {
            "message": "No groupid in request"
        });
    }
}

// Delete a group by Id - DELETE
module.exports.deleteGroup = function(req, res) {
    if (req.params && req.params.groupid) {
        Group
            .findById(req.params.groupid)
            .exec(function(err, group) {
                if (!group) {
                    sendJsonResponse(res, 404, {
                        "message": "groupid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
                group.remove((err) => {
                    if (err) {
                        return next(err);
                    }
                    req.flash('success', { msg: 'Group information has been deleted.' });
                    console.log('group information was deleted');
                });
                sendJsonResponse(res, 200, group);
            });
    } else {
        console.log('No groupid specified');
        sendJsonResponse(res, 404, {
            "message": "No groupid in request"
        });
    }
}

//Get all athletes - GET
module.exports.getAllAthletes = function(req, res) {

}


// Add a user to a group - PUT - DONE
module.exports.addUser = function(req, res) {
    console.log('adding a user to a group');
    if (req.params && req.params.teamid && req.params.groupid && req.params.userid) {
        console.log(req.params.teamid);

        Team
            .findById(req.params.teamid)
            .select('groups')
            .exec(function(err, team) {

                if (!team) {
                    sendJsonResponse(res, 404, { "message": "team not found" });
                    return;
                } else if (err) {
                    console.log(err);
                    sendJsonResponse(res, 404, err);
                    return;
                }
                console.log(req.params.groupid)
                thisGroup = team.groups.id(req.params.groupid);
                if (!thisGroup) {
                    sendJsonResponse(res, 404, {
                        "message": "groupid not found"
                    });
                } else {

                    User
                        .findById(req.params.userid)
                        .exec(function(err, user) {
                            if (!user) {
                                sendJsonResponse(res, 404, {
                                    "message": "userid not found"
                                });
                                return;
                            } else if (err) {
                                console.log(err)
                                sendJsonResponse(res, 404, err);
                                return;
                            }
                            console.log('about to log thisGroup._id')
                            console.log(thisGroup._id);
                            user.athlete.groups.push(thisGroup._id);
                            //       newAthletesArr = group.athletes.concat([user])
                            // group.athletes = newAthletesArr
                            var athlete_id = user._id;

                            thisGroup.athletes.push(athlete_id);

                            user.save((err) => {
                                if(err) {
                                    return err;
                                } else{
                                    console.log('The user has added a groupid to groups[]')
                                }

                            });

                            team.save((err) => {
                                if (err) {
                                    return err;
                                }
                                req.flash('success', { msg: 'The user has been added to the group' });
                                console.log('The user has been added to the group');
                            });
                            sendJsonResponse(res, 201, thisGroup);
                        })
                }
            });
    } else {
        console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
    }
}