var _ = require('lodash');
var async = require('async');

/**
 * Split into declaration and initialization for better startup performance.
 */
var Y;
var request;

/**
 * GET /api
 * List of API examples.
 */
exports.getApi = function(req, res) {
  res.render('api/index', {
    title: 'Yahoo Finance'
  });
};

/**
 * GET /api/yahoo
 * Yahoo API example.
 */
exports.getYahoo = function(req, res) {
  Y = require('yui/yql');

  Y.YQL('select * from yahoo.finance.quote where symbol in ("YHOO","AAPL","GOOG","MSFT")', function(response) {
    var results = response.query.results.quote;
    console.log(results);
    var condition = "";

    res.render('api/yahoo', {
      title: 'Yahoo API',
      location: results,
      condition: condition
    });
  });
  
/*
  
  Y.YQL('select * from yahoo.finance.quote where symbol in ("GOOG")', function(response) {
    var location = response.query.results.quote;
    var condition = "";
    res.render('api/yahoo', {
      title: 'Yahoo API',
      location: location,
      condition: condition
    });
  });
  */
};

