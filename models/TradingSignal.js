const mongoose = require('mongoose');

const tradingSignalSchema = new mongoose.Schema({
  signalId : { 
    type:String, 
    unique: true,
    required: true
  },
  symbol: { 
    type:String,
    required: true
  },
  signalCount: { 
    type:Number,
    required: true
  },
  snapshot: String,
  time: { 
    type:Date,
    required: true
  }
}, { timestamps: true });

const TradingSignal = mongoose.model('TradingSignal', tradingSignalSchema);

module.exports = TradingSignal;
