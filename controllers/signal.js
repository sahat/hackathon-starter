const crypto = require('crypto');
const TradingSignal = require('../models/TradingSignal');

/**
 * GET /tradingsignals
 * Trading signals page
 */
exports.getTradingSignals = (req, res) => {

  var records = TradingSignal.find( {} , function(err, items) {
    if (err) {
      req.flash(err);
    } else {
      console.log(items);
      res.jsonp(items);
    }          
  });
};

/**
 * POST /tradingsignals
 * Add tradingsignals to db
 */
exports.postTradingSignals = (req, res) => {
  let tickSignalsLog;

  // post request validation, not setup yet
  if (!req.user) {
    // validate origin, validate token
  }
  req.assert('TickBundleDetails', 'TickBundleDetails cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/');
  }

  // parse signal content
  var tickBundleDetails = req.body.TickBundleDetails;
  for (var i = 0; i < tickBundleDetails.length; i++){
    var symbol = tickBundleDetails[i].symbol;
    var signalCount = tickBundleDetails[i].signalCount;
    var time = tickBundleDetails[i].Time;
    var snapshot = JSON.stringify(tickBundleDetails[i].TickDetails);

    var id = crypto.createHash('md5').update(symbol + time.toISOString()).digest('hex');

    TradingSignal.findById(id, (err, tradingSignal) => {
      if (err) { return next(err); }
      tradingSignal.signalCount = signalCount;
      tradingSignal.symbol = symbol;
      tradingSignal.time = time;
      tradingSignal.snapshot = snapshot;

      tradingSignal.save((err) => {
        if (err) {
          if (err.code === 11000) {
            req.flash('errors', { msg: 'The tradingSignal you have entered already exists.' });
            return res.redirect('/signal');
          }
          return next(err);
        }
        req.flash('success', { msg: 'Trading signals added.' });
        res.redirect('/signal');
      });
    });
  };
};
