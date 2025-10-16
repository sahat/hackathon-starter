const { format } = require('util');

// Flash Middleware
exports.flash = (req, res, next) => {
  if (req.flash) return next();
  req.flash = (type, message, ...args) => {
    const flashMessages = (req.session.flash ||= {});
    if (!type) {
      req.session.flash = {};
      return { ...flashMessages };
    }
    if (!message) {
      const retrieved = flashMessages[type] || [];
      delete flashMessages[type];
      return retrieved;
    }
    const arr = (flashMessages[type] ||= []);
    if (args.length) arr.push(format(message, ...args));
    else if (Array.isArray(message)) {
      arr.push(...message);
      return arr.length;
    } else arr.push(message);
    return arr;
  };
  res.render = ((r) =>
    function (...args) {
      res.locals.messages = req.flash();
      return r.apply(this, args);
    })(res.render);
  next();
};
