const { format } = require('util');

// Flash Middleware as a replacement for express-flash / connect-flash
// Those packages are unmaintained and have some issues. This is a simple
// implementation that provides the same functionality.
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
      // Retrieve and clear all flash messages for this render
      const raw = req.flash();

      // Normalize to arrays of { msg } objects to match express-flash contract
      const messages = {};
      for (const [type, list] of Object.entries(raw)) {
        const arr = Array.isArray(list) ? list : [list];
        messages[type] = arr.map((item) => (item && typeof item === 'object' && 'msg' in item ? item : { msg: String(item) }));
      }

      res.locals.messages = messages;
      return r.apply(this, args);
    })(res.render);
  next();
};
