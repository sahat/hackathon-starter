
exports.requireRole = function(role) {
  return function(req, res, next) {
    console.log(req.session.user);
    console.log(role);
    //TODO have this work with an array of roles. role in aray
    //if(req.session.user && req.session.user.role === role) {
    //  next();
    //} else {
      //res.send(403);
      res.status(403).render('403', {url:req.url});
    //}
  }
}

// create event to push to listening clients
exports.event = function (operation, sig) {
    var e = operation + ':';
    e += sig.endPoint;
    return e;
}

exports.signature = function(model) {
    var sig = {};
    sig.endPoint = model._id;
    return sig;
}

exports.createSessionKey = function(len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  len = len || '24';
  var randomString = '';
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz,randomPoz+1);
  }
  return randomString;
}

exports.slugify = function(v) {
  return (v || '').replace(/\s+/g, '')
}
