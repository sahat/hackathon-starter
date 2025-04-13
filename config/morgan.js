const logger = require('morgan');
const Bowser = require('bowser');

// Color definitions for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// Custom colored status token
logger.token('colored-status', (req, res) => {
  const status = res.statusCode;
  let color;
  if (status >= 500) color = colors.red;
  else if (status >= 400) color = colors.yellow;
  else if (status >= 300) color = colors.cyan;
  else color = colors.green;

  return color + status + colors.reset;
});

// Custom token for timestamp without timezone offset
logger.token('short-date', () => {
  const now = new Date();
  return now.toLocaleString('sv').replace(',', '');
});

// Custom token for simplified user agent using Bowser
logger.token('parsed-user-agent', (req) => {
  const userAgent = req.headers['user-agent'];
  if (!userAgent) return 'Unknown';
  const parsedUA = Bowser.parse(userAgent);
  const osName = parsedUA.os.name || 'Unknown';
  const browserName = parsedUA.browser.name || 'Unknown';

  // Get major version number
  const version = parsedUA.browser.version || '';
  const majorVersion = version.split('.')[0];

  return `${osName}/${browserName} v${majorVersion}`;
});

// Custom token for content length in KB
logger.token('content-length-in-kb', (req, res) => {
  const length = res.getHeader('Content-Length');
  if (!length) return '-';

  const sizeInKB = (length / 1024).toFixed(2);
  return `${sizeInKB}KB`;
});

// Define the custom format
const morganFormat = ':short-date :method :url :colored-status :response-time[0]ms :content-length-in-kb :remote-addr :parsed-user-agent';

// Export the logger setup function
exports.morganLogger = () =>
  logger(morganFormat, {
    immediate: false,
  });
