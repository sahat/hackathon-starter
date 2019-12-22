/* eslint-disable no-console */

const chalk = require('chalk');
const ip = require('ip');

const divider = chalk.gray('\n-----------------------------------');

/**
 * Logger middleware, you can customize it to make messages more personal
 */
const logger = {
  // Called whenever there's an error on the server we want to print
  error: (err) => {
    console.error(chalk.red(err));
<<<<<<< HEAD
=======
    process.exit();
>>>>>>> e0c6a5360f945c2fe34c03e11e3c2f9c9795236d
  },

  // Called when express.js app starts on given port w/o errors
  appStarted: (port, host) => {
    console.log(`Server started ! ${chalk.green('✓')}`);

    console.log(`
     ${chalk.bold('Access URLs:')}${divider}
     Localhost: ${chalk.magenta(`http://${host}:${port}`)}
     LAN: ${chalk.magenta(`http://${ip.address()}:${port}`)}
     ${chalk.blue(`Press ${chalk.italic('CTRL-C')} to stop`)}
    `);
  },
};

module.exports = logger;
