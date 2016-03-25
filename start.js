'use strict';

/**
 * Add a global var to conform to webpack config.
 */
global.__DEVELOPMENT__ = process.env.NODE_ENV !== 'production';

/**
 * Run all requires in our server-side app through babel.
 *
 * This allows us to use ES2015 everywhere.
 */
require('babel-core/register')({
  sourceMap: !__DEVELOPMENT__
});

/**
 * Run the actual app.
 */
require('./app.js');
