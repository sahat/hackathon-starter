module.exports = {
  connectToMongo: require('./connect-to-mongo'),
  routes: {
    userAccount: require('./user-account'),
    oauth: require('./oauth'),
    thirdPartyApi: require('./third-party-api')
  }
}