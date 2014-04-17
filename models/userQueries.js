var mongoose = require('mongoose');
var User = require('../models/User');

exports.getUsers = function(myData, callback) {
  User.find( myData, function(err, model) {
    if(err) throw err;
    callback(model);
  });
}

exports.getUser = function(myData, callback) {
  var myQuery = {};
  myQuery._id = myData.id;
  User.find( myQuery, function(err, model) { 
    if(err) throw err;
    callback(model);
  });
}

exports.createUser = function(myData, callback) {
  new User(myData).save(function(err, model) {
    if(err) throw err;
    callback(model);
  });
}

exports.editUser = function(myData, callback, options) {
  User.findById(myData._id, function(err, model) {
    if(err) throw err;
    if(model) {
      for(myItem in myData) {
        model[myItem] = myData[myItem];
      }
      model.save(function(err) {
        if(err) throw err;
        callback(model);
      });
    }
  });
}

exports.deleteUser = function(myData, callback) {
  myData.id = myData._id || myData.id;
  User.findById(myData.id, function(err, model) {
    if(model) {
      model.remove(function(err) {
        if(err) throw err;
        callback(model);
      });
    }
  });
}

