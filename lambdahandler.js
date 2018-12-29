const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');

exports.app = function handleLambdaRequest(event, context, callback) {
  const server = awsServerlessExpress.createServer(app);
  awsServerlessExpress.proxy(server, event, context);
}
