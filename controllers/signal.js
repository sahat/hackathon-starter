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

  const validateSource = () => {
    var qc_code = process.env.QC_CODE;
    var code = req.body.QcCode;
    if (qc_code !== code) {
      req.flash('error code');
      return res.redirect('/');
    }
  }
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

  // parse signal content
  var tickBundleDetails = req.body.TickBundleDetails;
  for (var i = 0; i < tickBundleDetails.length; i++){
    var symbol = tickBundleDetails[i].TickBundleSymbol;
    var signalCount = tickBundleDetails[i].SignalCount;
    var time = tickBundleDetails[i].Time;
    var snapshot = JSON.stringify(tickBundleDetails[i].TickDetails);

    var id = crypto.createHash('md5').update(symbol + time.toString()).digest('hex');

    TradingSignal.findOne({'signalId': id}, (err, tradingSignal) => {
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
    });
  };
};
