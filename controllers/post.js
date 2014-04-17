var _ = require('underscore');
var Post = require('../models/Post');

var postQ = require('../models/postQueries');
var util = require('../config/util');

/*
 * API Requests
 */

exports.getPosts = function(req, res, myData) {
  console.log(myData);
  postQ.getPosts(myData, function(model) {
    if( req.params.format == '.js' ) {
      res.send(model);
    } else {
      model.title = 'Posts';
      res.render('posts', model);
    }
  });
};

exports.getPost = function(req, res, myData) {
  postQ.getPost(myData, function(model) {
    if( req.params.format == '.js' ) {
      res.send(model);
    } else {
      model.title = 'Posts';
      res.render('posts', model);
    }
  });
};

exports.createPost = function(req, res, myData) {
  myData = myData.post ? myData.post : myData;
  postQ.createPost(myData, function(model) {
    res.send(model);
  });
}

exports.editPost = function(req, res, myData) {
  myData._id = myData._id || req.params.id;
  postQ.editPost(myData, function(model) {
    res.send(model);
  });
}

exports.deletePost = function(req, res, myData) {
  postQ.deletePost({id: req.params.id}, function(model) {
    res.send({'success':true});
  });
}

/*
 * API Events
 */

exports.createPostEvent = function(socket, signature, myData) {
  var e = util.event('create:post', signature);
  myData._id = null; delete myData._id;
  postQ.createPost(myData, function(resData) {
    socket.emit(e, {id : resData._id});
    socket.broadcast.emit('addpost', resData);
  });
};

exports.readPostEvent = function(socket, signature, myData, sockets) {
  var e = util.event('read:post', signature);
  typeof myData==='undefined' ? myData={id:false}:'';
  if(myData.id) {
    postQ.getPost({id: myData.id}, function(resData) {
      socket.emit(e, resData);
    });
  } else {
    postQ.getPosts({}, function(resData) {
      socket.emit(e, resData);
    });
  }
};

exports.updatePostEvent = function(socket, signature, myData) {
  var e = util.event('update:post', signature);
  typeof myData==='undefined' ? myData={_id:false}:'';
  if(myData._id) {
    postQ.editPost(myData, function(resData) {
      socket.emit(e, {success: true});
      socket.broadcast.emit(e, resData);
    });
  }
};

exports.destroyPostEvent = function(socket, signature, myData) {
  var e = util.event('delete:post', signature);
  typeof myData==='undefined' ? myData={_id:false}:''; 
  if(myData._id) {
    postQ.deletePost(myData, function(resData) {
      socket.emit(e, resData);
      socket.broadcast.emit(e, resData);
    });
  }
};
