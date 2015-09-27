/**
 * Split into declaration and initialization for better performance.
 */
var validator;
var cheerio;
var graph;
var LastFmNode;
var tumblr;
var foursquare;
var Github;
var Twit;
var stripe;
var twilio;
var Linkedin;
var BitGo;
var clockwork;
var paypal;
var lob;
var ig;
var Y;
var Bitcore;
var BitcoreInsight;
var request;


var _ = require('lodash');
var async = require('async');
var querystring = require('querystring');


var secrets = require('../config/secrets');



/**
 * GET /api
 * List of API examples.
 */
exports.getApi = function(req, res) {
  res.render('api/index', {
    title: 'API Examples'
  });
};

/**
 * GET /api/foursquare
 * Foursquare API example.
 */
exports.getFoursquare = function(req, res, next) {
  foursquare = require('node-foursquare')({ secrets: secrets.foursquare });

  var token = _.find(req.user.tokens, { kind: 'foursquare' });
  async.parallel({
    trendingVenues: function(callback) {
      foursquare.Venues.getTrending('40.7222756', '-74.0022724', { limit: 50 }, token.accessToken, function(err, results) {
        callback(err, results);
      });
    },
    venueDetail: function(callback) {
      foursquare.Venues.getVenue('49da74aef964a5208b5e1fe3', token.accessToken, function(err, results) {
        callback(err, results);
      });
    },
    userCheckins: function(callback) {
      foursquare.Users.getCheckins('self', null, token.accessToken, function(err, results) {
        callback(err, results);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/foursquare', {
      title: 'Foursquare API',
      trendingVenues: results.trendingVenues,
      venueDetail: results.venueDetail,
      userCheckins: results.userCheckins
    });
  });
};

/**
 * GET /api/tumblr
 * Tumblr API example.
 */
exports.getTumblr = function(req, res, next) {
  tumblr = require('tumblr.js');

  var token = _.find(req.user.tokens, { kind: 'tumblr' });
  var client = tumblr.createClient({
    consumer_key: secrets.tumblr.consumerKey,
    consumer_secret: secrets.tumblr.consumerSecret,
    token: token.accessToken,
    token_secret: token.tokenSecret
  });
  client.posts('withinthisnightmare.tumblr.com', { type: 'photo' }, function(err, data) {
    if (err) return next(err);
    res.render('api/tumblr', {
      title: 'Tumblr API',
      blog: data.blog,
      photoset: data.posts[0].photos
    });
  });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */
exports.getFacebook = function(req, res, next) {
  graph = require('fbgraph');

  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  async.parallel({
    getMe: function(done) {
      graph.get(req.user.facebook, function(err, me) {
        done(err, me);
      });
    },
    getMyFriends: function(done) {
      graph.get(req.user.facebook + '/friends', function(err, friends) {
        done(err, friends.data);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/facebook', {
      title: 'Facebook API',
      me: results.getMe,
      friends: results.getMyFriends
    });
  });
};

/**
 * GET /api/scraping
 * Web scraping example using Cheerio library.
 */
exports.getScraping = function(req, res, next) {
  cheerio = require('cheerio');
  request = require('request');

  request.get('https://news.ycombinator.com/', function(err, request, body) {
    if (err) return next(err);
    var $ = cheerio.load(body);
    var links = [];
    $('.title a[href^="http"], a[href^="https"]').each(function() {
      links.push($(this));
    });
    res.render('api/scraping', {
      title: 'Web Scraping',
      links: links
    });
  });
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = function(req, res, next) {
  Github = require('github-api');

  var token = _.find(req.user.tokens, { kind: 'github' });
  var github = new Github({ token: token.accessToken });
  var repo = github.getRepo('sahat', 'requirejs-library');
  repo.show(function(err, repo) {
    if (err) return next(err);
    res.render('api/github', {
      title: 'GitHub API',
      repo: repo
    });
  });

};

/**
 * GET /api/aviary
 * Aviary image processing example.
 */
exports.getAviary = function(req, res) {
  res.render('api/aviary', {
    title: 'Aviary API'
  });
};

/**
 * GET /api/nyt
 * New York Times API example.
 */
exports.getNewYorkTimes = function(req, res, next) {
  request = require('request');

  var query = querystring.stringify({ 'api-key': secrets.nyt.key, 'list-name': 'young-adult' });
  var url = 'http://api.nytimes.com/svc/books/v2/lists?' + query;
  request.get(url, function(err, request, body) {
    if (err) return next(err);
    if (request.statusCode === 403) return next(Error('Missing or Invalid New York Times API Key'));
    var bestsellers = JSON.parse(body);
    res.render('api/nyt', {
      title: 'New York Times API',
      books: bestsellers.results
    });
  });
};

/**
 * GET /api/lastfm
 * Last.fm API example.
 */
exports.getLastfm = function(req, res, next) {
  request = require('request');
  LastFmNode = require('lastfm').LastFmNode;

  var lastfm = new LastFmNode(secrets.lastfm);
  async.parallel({
    artistInfo: function(done) {
      lastfm.request('artist.getInfo', {
        artist: 'The Pierces',
        handlers: {
          success: function(data) {
            done(null, data);
          },
          error: function(err) {
            done(err);
          }
        }
      });
    },
    artistTopTracks: function(done) {
      lastfm.request('artist.getTopTracks', {
        artist: 'The Pierces',
        handlers: {
          success: function(data) {
            var tracks = [];
            _.each(data.toptracks.track, function(track) {
              tracks.push(track);
            });
            done(null, tracks.slice(0,10));
          },
          error: function(err) {
            done(err);
          }
        }
      });
    },
    artistTopAlbums: function(done) {
      lastfm.request('artist.getTopAlbums', {
        artist: 'The Pierces',
        handlers: {
          success: function(data) {
            var albums = [];
            _.each(data.topalbums.album, function(album) {
              albums.push(album.image.slice(-1)[0]['#text']);
            });
            done(null, albums.slice(0, 4));
          },
          error: function(err) {
            done(err);
          }
        }
      });
    }
  },
  function(err, results) {
    if (err) return next(err.message);
    var artist = {
      name: results.artistInfo.artist.name,
      image: results.artistInfo.artist.image.slice(-1)[0]['#text'],
      tags: results.artistInfo.artist.tags.tag,
      bio: results.artistInfo.artist.bio.summary,
      stats: results.artistInfo.artist.stats,
      similar: results.artistInfo.artist.similar.artist,
      topAlbums: results.artistTopAlbums,
      topTracks: results.artistTopTracks
    };
    res.render('api/lastfm', {
      title: 'Last.fm API',
      artist: artist
    });
  });
};

/**
 * GET /api/twitter
 * Twiter API example.
 */
exports.getTwitter = function(req, res, next) {
  Twit = require('twit');

  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var T = new Twit({
    consumer_key: secrets.twitter.consumerKey,
    consumer_secret: secrets.twitter.consumerSecret,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  T.get('search/tweets', { q: 'nodejs since:2013-01-01', geocode: '40.71448,-74.00598,5mi', count: 10 }, function(err, reply) {
    if (err) return next(err);
    res.render('api/twitter', {
      title: 'Twitter API',
      tweets: reply.statuses
    });
  });
};

/**
 * POST /api/twitter
 * Post a tweet.
 */
exports.postTwitter = function(req, res, next) {
  req.assert('tweet', 'Tweet cannot be empty.').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twitter');
  }
  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var T = new Twit({
    consumer_key: secrets.twitter.consumerKey,
    consumer_secret: secrets.twitter.consumerSecret,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  T.post('statuses/update', { status: req.body.tweet }, function(err, data, response) {
    if (err) return next(err);
    req.flash('success', { msg: 'Tweet has been posted.'});
    res.redirect('/api/twitter');
  });
};

/**
 * GET /api/steam
 * Steam API example.
 */
exports.getSteam = function(req, res, next) {
  request = require('request');

  var steamId = '76561197982488301';
  var query = { l: 'english', steamid: steamId, key: secrets.steam.apiKey };
  async.parallel({
    playerAchievements: function(done) {
      query.appid = '49520';
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?' + qs, json: true }, function(error, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(error, body);
      });
    },
    playerSummaries: function(done) {
      query.steamids = steamId;
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?' + qs, json: true }, function(err, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(err, body);
      });
    },
    ownedGames: function(done) {
      query.include_appinfo = 1;
      query.include_played_free_games = 1;
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?' + qs, json: true }, function(err, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(err, body);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/steam', {
      title: 'Steam Web API',
      ownedGames: results.ownedGames.response.games,
      playerAchievemments: results.playerAchievements.playerstats,
      playerSummary: results.playerSummaries.response.players[0]
    });
  });
};

/**
 * GET /api/stripe
 * Stripe API example.
 */
exports.getStripe = function(req, res) {
  stripe = require('stripe')(secrets.stripe.secretKey);

  res.render('api/stripe', {
    title: 'Stripe API',
    publishableKey: secrets.stripe.publishableKey
  });
};

/**
 * POST /api/stripe
 * Make a payment.
 */
exports.postStripe = function(req, res, next) {
  var stripeToken = req.body.stripeToken;
  var stripeEmail = req.body.stripeEmail;
  stripe.charges.create({
    amount: 395,
    currency: 'usd',
    source: stripeToken,
    description: stripeEmail
  }, function(err, charge) {
    if (err && err.type === 'StripeCardError') {
      req.flash('errors', { msg: 'Your card has been declined.' });
      res.redirect('/api/stripe');
    }
    req.flash('success', { msg: 'Your card has been charged successfully.' });
    res.redirect('/api/stripe');
  });
};

/**
 * GET /api/twilio
 * Twilio API example.
 */
exports.getTwilio = function(req, res) {
  twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);

  res.render('api/twilio', {
    title: 'Twilio API'
  });
};

/**
 * POST /api/twilio
 * Send a text message using Twilio.
 */
exports.postTwilio = function(req, res, next) {
  req.assert('number', 'Phone number is required.').notEmpty();
  req.assert('message', 'Message cannot be blank.').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twilio');
  }
  var message = {
    to: req.body.number,
    from: '+13472235148',
    body: req.body.message
  };
  twilio.sendMessage(message, function(err, responseData) {
    if (err) return next(err.message);
    req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'});
    res.redirect('/api/twilio');
  });
};

/**
 * GET /api/clockwork
 * Clockwork SMS API example.
 */
exports.getClockwork = function(req, res) {
  clockwork = require('clockwork')({ key: secrets.clockwork.apiKey });

  res.render('api/clockwork', {
    title: 'Clockwork SMS API'
  });
};

/**
 * POST /api/clockwork
 * Send a text message using Clockwork SMS
 */
exports.postClockwork = function(req, res, next) {
  var message = {
    To: req.body.telephone,
    From: 'Hackathon',
    Content: 'Hello from the Hackathon Starter'
  };
  clockwork.sendSms(message, function(err, responseData) {
    if (err) return next(err.errDesc);
    req.flash('success', { msg: 'Text sent to ' + responseData.responses[0].to });
    res.redirect('/api/clockwork');
  });
};

/**
 * GET /api/venmo
 * Venmo API example.
 */
exports.getVenmo = function(req, res, next) {
  request = require('request');

  var token = _.find(req.user.tokens, { kind: 'venmo' });
  var query = querystring.stringify({ access_token: token.accessToken });
  async.parallel({
    getProfile: function(done) {
      request.get({ url: 'https://api.venmo.com/v1/me?' + query, json: true }, function(err, request, body) {
        done(err, body);
      });
    },
    getRecentPayments: function(done) {
      request.get({ url: 'https://api.venmo.com/v1/payments?' + query, json: true }, function(err, request, body) {
        done(err, body);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/venmo', {
      title: 'Venmo API',
      profile: results.getProfile.data,
      recentPayments: results.getRecentPayments.data
    });
  });
};

/**
 * POST /api/venmo
 * Send money.
 */
exports.postVenmo = function(req, res, next) {
  validator = require('validator');

  req.assert('user', 'Phone, Email or Venmo User ID cannot be blank').notEmpty();
  req.assert('note', 'Please enter a message to accompany the payment').notEmpty();
  req.assert('amount', 'The amount you want to pay cannot be blank').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/venmo');
  }
  var token = _.find(req.user.tokens, { kind: 'venmo' });
  var formData = {
    access_token: token.accessToken,
    note: req.body.note,
    amount: req.body.amount
  };
  if (validator.isEmail(req.body.user)) {
    formData.email = req.body.user;
  } else if (validator.isNumeric(req.body.user) &&
    validator.isLength(req.body.user, 10, 11)) {
    formData.phone = req.body.user;
  } else {
    formData.user_id = req.body.user;
  }
  request.post('https://api.venmo.com/v1/payments', { form: formData }, function(err, request, body) {
    if (err) return next(err);
    if (request.statusCode !== 200) {
      req.flash('errors', { msg: JSON.parse(body).error.message });
      return res.redirect('/api/venmo');
    }
    req.flash('success', { msg: 'Venmo money transfer complete' });
    res.redirect('/api/venmo');
  });
};

/**
 * GET /api/linkedin
 * LinkedIn API example.
 */
exports.getLinkedin = function(req, res, next) {
  Linkedin = require('node-linkedin')(secrets.linkedin.clientID, secrets.linkedin.clientSecret, secrets.linkedin.callbackURL);

  var token = _.find(req.user.tokens, { kind: 'linkedin' });
  var linkedin = Linkedin.init(token.accessToken);
  linkedin.people.me(function(err, $in) {
    if (err) return next(err);
    res.render('api/linkedin', {
      title: 'LinkedIn API',
      profile: $in
    });
  });
};

/**
 * GET /api/instagram
 * Instagram API example.
 */
exports.getInstagram = function(req, res, next) {
  ig = require('instagram-node').instagram();

  var token = _.find(req.user.tokens, { kind: 'instagram' });
  ig.use({ client_id: secrets.instagram.clientID, client_secret: secrets.instagram.clientSecret });
  ig.use({ access_token: token.accessToken });
  async.parallel({
    searchByUsername: function(done) {
      ig.user_search('richellemead', function(err, users, limit) {
        done(err, users);
      });
    },
    searchByUserId: function(done) {
      ig.user('175948269', function(err, user) {
        done(err, user);
      });
    },
    popularImages: function(done) {
      ig.media_popular(function(err, medias) {
        done(err, medias);
      });
    },
    myRecentMedia: function(done) {
      ig.user_self_media_recent(function(err, medias, pagination, limit) {
        done(err, medias);
      });
    }
  }, function(err, results) {
    if (err) return next(err);
    res.render('api/instagram', {
      title: 'Instagram API',
      usernames: results.searchByUsername,
      userById: results.searchByUserId,
      popularImages: results.popularImages,
      myRecentMedia: results.myRecentMedia
    });
  });
};

/**
 * GET /api/yahoo
 * Yahoo API example.
 */
exports.getYahoo = function(req, res) {
  Y = require('yui/yql');

  Y.YQL('SELECT * FROM weather.forecast WHERE (location = 10007)', function(response) {
    var location = response.query.results.channel.location;
    var condition = response.query.results.channel.item.condition;
    res.render('api/yahoo', {
      title: 'Yahoo API',
      location: location,
      condition: condition
    });
  });
};

/**
 * GET /api/paypal
 * PayPal SDK example.
 */
exports.getPayPal = function(req, res, next) {
  paypal = require('paypal-rest-sdk');

  paypal.configure({
    mode: 'sandbox',
    client_id: secrets.paypal.client_id,
    client_secret: secrets.paypal.client_secret
  });

  var paymentDetails = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: secrets.paypal.returnUrl,
      cancel_url: secrets.paypal.cancelUrl
    },
    transactions: [{
      description: 'Hackathon Starter',
      amount: {
        currency: 'USD',
        total: '1.99'
      }
    }]
  };

  paypal.payment.create(paymentDetails, function(err, payment) {
    if (err) return next(err);
    req.session.paymentId = payment.id;
    var links = payment.links;
    for (var i = 0; i < links.length; i++) {
      if (links[i].rel === 'approval_url') {
        res.render('api/paypal', {
          approvalUrl: links[i].href
        });
      }
    }
  });
};

/**
 * GET /api/paypal/success
 * PayPal SDK example.
 */
exports.getPayPalSuccess = function(req, res) {
  var paymentId = req.session.paymentId;
  var paymentDetails = { payer_id: req.query.PayerID };
  paypal.payment.execute(paymentId, paymentDetails, function(err) {
    if (err) {
      res.render('api/paypal', {
        result: true,
        success: false
      });
    } else {
      res.render('api/paypal', {
        result: true,
        success: true
      });
    }
  });
};

/**
 * GET /api/paypal/cancel
 * PayPal SDK example.
 */
exports.getPayPalCancel = function(req, res) {
  req.session.paymentId = null;
  res.render('api/paypal', {
    result: true,
    canceled: true
  });
};

/**
 * GET /api/lob
 * Lob API example.
 */
exports.getLob = function(req, res, next) {
  lob = require('lob')(secrets.lob.apiKey);

  lob.routes.list({
    zip_codes: ['10007']
  }, function(err, routes) {
    if(err) return next(err);
    res.render('api/lob', {
      title: 'Lob API',
      routes: routes.data[0].routes
    });
  });
};

/**
 * GET /api/bitgo
 * BitGo wallet example
 */
exports.getBitGo = function(req, res, next) {
  BitGo = require('bitgo');

  var bitgo = new BitGo.BitGo({ env: 'test', accessToken: secrets.bitgo.accessToken });
  var walletId = req.session.walletId;

  var renderWalletInfo = function(walletId) {
    bitgo.wallets().get({ id: walletId }, function(err, walletResponse) {
      walletResponse.createAddress({}, function(err, addressResponse) {
        walletResponse.transactions({}, function(err, transactionsResponse) {
          res.render('api/bitgo', {
            title: 'BitGo API',
            wallet: walletResponse.wallet,
            address: addressResponse.address,
            transactions: transactionsResponse.transactions
          });
        });
      });
    });
  };

  if (walletId) {
    renderWalletInfo(walletId);
  } else {
    bitgo.wallets().createWalletWithKeychains({
        passphrase: req.sessionID, // change this!
        label: 'wallet for session ' + req.sessionID,
        backupXpub: 'xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU'
      }, function(err, res) {
        req.session.walletId = res.wallet.wallet.id;
        renderWalletInfo(req.session.walletId);
      }
    );
  }
};


/**
 * POST /api/bitgo
 * BitGo send coins example
 */
exports.postBitGo = function(req, res, next) {
  var bitgo = new BitGo.BitGo({ env: 'test', accessToken: secrets.bitgo.accessToken });
  var walletId = req.session.walletId;

  try {
    bitgo.wallets().get({ id: walletId }, function(err, wallet) {
      wallet.sendCoins({
        address: req.body.address,
        amount: parseInt(req.body.amount),
        walletPassphrase: req.sessionID
      }, function(err, result) {
        if (err) {
          req.flash('errors', { msg: err.message });
          return res.redirect('/api/bitgo');
        }
        req.flash('info', { msg: 'txid: ' + result.hash + ', hex: ' + result.tx });
        return res.redirect('/api/bitgo');
      });
    });
  } catch (e) {
    req.flash('errors', { msg: e.message });
    return res.redirect('/api/bitgo');
  }
};


/**
 * GET /api/bicore
 * Bitcore example
 */
exports.getBitcore = function(req, res, next) {
  Bitcore = require('bitcore');
  Bitcore.Networks.defaultNetwork = secrets.bitcore.bitcoinNetwork == 'testnet' ? Bitcore.Networks.testnet : Bitcore.Networks.mainnet;

  try {
    var privateKey;

    if (req.session.bitcorePrivateKeyWIF) {
      privateKey = Bitcore.PrivateKey.fromWIF(req.session.bitcorePrivateKeyWIF);
    } else {
      privateKey = new Bitcore.PrivateKey();
      req.session.bitcorePrivateKeyWIF = privateKey.toWIF();
      req.flash('info', {
        msg: 'A new ' + secrets.bitcore.bitcoinNetwork + ' private key has been created for you and is stored in ' +
        'req.session.bitcorePrivateKeyWIF. Unless you changed the Bitcoin network near the require bitcore line, ' +
        'this is a testnet address.'
      });
    }

    var myAddress = privateKey.toAddress();
    var bitcoreUTXOAddress = '';

    if (req.session.bitcoreUTXOAddress)
      bitcoreUTXOAddress = req.session.bitcoreUTXOAddress;
    res.render('api/bitcore', {
      title: 'Bitcore API',
      network: secrets.bitcore.bitcoinNetwork,
      address: myAddress,
      getUTXOAddress: bitcoreUTXOAddress
    });
  } catch (e) {
    req.flash('errors', { msg: e.message });
    return next(e);
  }
};

/**
 * POST /api/bitcore
 * Bitcore send coins example
 */
exports.postBitcore = function(req, res, next) {
  BitcoreInsight = require('bitcore-explorers').Insight;

  try {
    var getUTXOAddress;

    if (req.body.address) {
      getUTXOAddress = req.body.address;
      req.session.bitcoreUTXOAddress = getUTXOAddress;
    } else if (req.session.bitcoreUTXOAddress) {
      getUTXOAddress = req.session.bitcoreUTXOAddress;
    } else {
      getUTXOAddress = '';
    }

    var myAddress;

    if (req.session.bitcorePrivateKeyWIF) {
      myAddress = Bitcore.PrivateKey.fromWIF(req.session.bitcorePrivateKeyWIF).toAddress();
    } else {
      myAddress = '';
    }

    var insight = new BitcoreInsight();

    insight.getUnspentUtxos(getUTXOAddress, function(err, utxos) {
      if (err) {
        req.flash('errors', { msg: err.message });
        return next(err);
      } else {
        req.flash('info', { msg: 'UTXO information obtained from the Bitcoin network via Bitpay Insight. You can use your own full Bitcoin node.' });

        // Results are in the form of an array of items which need to be turned into JS objects.
        for (var i = 0; i < utxos.length; ++i) {
          utxos[i] = utxos[i].toObject();
        }

        res.render('api/bitcore', {
          title: 'Bitcore API',
          myAddress: myAddress,
          getUTXOAddress: getUTXOAddress,
          utxos: utxos,
          network: secrets.bitcore.bitcoinNetwork
        });
      }
    });
  } catch (e) {
    req.flash('errors', { msg: e.message });
    return next(e);
  }
};