var mongoose = require('mongoose');
var Group = mongoose.model('Group');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

// Create a new group - POST
module.exports.createGroup = function(req, res) {
	console.log('creating new group');
    const group = new Group({
    	name: req.body.name,
  		athletes: req.body.athletes
    });

    group.save((err) => {
    	if (err) {
    		sendJsonResponse(res, 404, err);
    		return err;
    	} else {
    		sendJsonResponse(res, 200, group);
    		console.log('group successfully created')
    	}
    })
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
                    "message": "No gropus found"
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



