const crypto = require('crypto');
const TradingSignal = require('../models/TradingSignal');

/**
 * GET /tradingsignals
 * Trading signals page
 */
exports.getTradingSignals = (req, res) => {
  TradingSignal.find({}, function(err, items) {
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
  const validateSource = () => {
    let qcCode = process.env.QC_CODE;
    let code = req.body.QcCode;
    if (qcCode !== code) {
      req.flash('error code');
      return res.redirect('/');
    }
  };
  // post request validation, not setup yet
  if (!req.user) {
    // validate origin, validate token
  }

  validateSource();

  req.assert('TickBundleDetails', 'TickBundleDetails cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/');
  }

  const saveSignal = (err, tradingSignal) => {
    if (err) { 
      req.flash('errors', err);
      return res.redirect('/');
    }

    if (tradingSignal){
      req.flash('errors: record exists');
      return res.redirect('/');
    }

    tradingSignal = new TradingSignal({
      signalId: id,
      symbol: symbol,
      signalCount: signalCount,
      snapshot: snapshot,
      time: time
    });

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
  };

  // parse signal content
  let tickBundleDetails = req.body.TickBundleDetails;
  let i;
  for (i = 0; i < tickBundleDetails.length; i++){
    let symbol = tickBundleDetails[i].TickBundleSymbol;
    let signalCount = tickBundleDetails[i].SignalCount;
    let time = tickBundleDetails[i].Time;
    let snapshot = JSON.stringify(tickBundleDetails[i].TickDetails);

    let id = crypto.createHash('md5').update(symbol + time.toString()).digest('hex');

    TradingSignal.findOne({ signalId: id }, saveSignal);
  };
};
