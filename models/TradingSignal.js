const mongoose = require('mongoose');

const tradingSignalSchema = new mongoose.Schema({
  signalId : { type:String, unique: true },
  symbol: String,
  signal: int,
  snapshot: String,
  time: Date
}, { timestamps: true });

const TradingSignal = mongoose.model('TradingSignal', tradingSignalSchema);

module.exports = TradingSignal;
