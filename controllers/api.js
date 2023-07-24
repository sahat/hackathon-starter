const { promisify } = require('util');
const cheerio = require('cheerio');
const { LastFmNode } = require('lastfm');
const { Octokit } = require('@octokit/rest');
const stripe = require('stripe')(process.env.STRIPE_SKEY);
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const paypal = require('paypal-rest-sdk');
const crypto = require('crypto');
const ig = require('instagram-node').instagram();
const axios = require('axios');
const googledrive = require('@googleapis/drive');
const googlesheets = require('@googleapis/sheets');
const validator = require('validator');
const {
  Configuration: LobConfiguration, LetterEditable, LettersApi, ZipEditable, ZipLookupsApi
} = require('@lob/lob-typescript-sdk');

/**
 * GET /api
 * List of API examples.
 */
exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'API Examples'
  });
};

/**
 * GET /api/foursquare
 * Foursquare API example.
 */
exports.getFoursquare = async (req, res, next) => {
  const token = await req.user.tokens.find((token) => token.kind === 'foursquare');
  let trendingVenues;
  let venueDetail;
  let userCheckins;
  axios.all([
    axios.get(`https://api.foursquare.com/v2/venues/trending?ll=40.7222756,-74.0022724&limit=50&oauth_token=${token.accessToken}&v=20140806`),
    axios.get(`https://api.foursquare.com/v2/venues/49da74aef964a5208b5e1fe3?oauth_token=${token.accessToken}&v=20190113`),
    axios.get(`https://api.foursquare.com/v2/users/self/checkins?oauth_token=${token.accessToken}&v=20190113`)
  ])
    .then(axios.spread((trendingVenuesRes, venueDetailRes, userCheckinsRes) => {
      trendingVenues = trendingVenuesRes.data.response;
      venueDetail = venueDetailRes.data.response;
      userCheckins = userCheckinsRes.data.response;
      res.render('api/foursquare', {
        title: 'Foursquare API',
        trendingVenues,
        venueDetail,
        userCheckins
      });
    }))
    .catch((error) => {
      next(error);
    });
};

/**
 * GET /api/tumblr
 * Tumblr API example.
 */
exports.getTumblr = (req, res, next) => {
  // const token = req.user.tokens.find((token) => token.kind === 'tumblr'); //unused
  const appkey = process.env.TUMBLR_KEY;
  // const appsecret = process.env.TUMBLR_SECRET; //unused in this example
  // const accessToken = token.accessToken; //unused in this example
  // const tokenSecret = token.tokenSecret; //unused in this example

  const blogId = 'mmosdotcom-blog.tumblr.com';
  const postType = 'photo';
  axios.get(`https://api.tumblr.com/v2/blog/${blogId}/posts/${postType}?api_key=${appkey}`)
    .then((response) => {
      res.render('api/tumblr', {
        title: 'Tumblr API',
        blog: response.data.response.blog,
        photoset: response.data.response.posts[0].photos
      });
    })
    .catch((error) => {
      next(error);
    });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */
exports.getFacebook = (req, res, next) => {
  const token = req.user.tokens.find((token) => token.kind === 'facebook');
  const secret = process.env.FACEBOOK_SECRET;
  const appsecretProof = crypto.createHmac('sha256', secret).update(token.accessToken).digest('hex');
  axios.get(`https://graph.facebook.com/${req.user.facebook}?fields=id,name,email,first_name,last_name,gender,link,locale,timezone&access_token=${token.accessToken}&appsecret_proof=${appsecretProof}`)
    .then((response) => {
      res.render('api/facebook', {
        title: 'Facebook API',
        profile: response.data
      });
    })
    .catch((error) => next(error.response));
};

/**
 * GET /api/scraping
 * Web scraping example using Cheerio library.
 */
exports.getScraping = (req, res, next) => {
  axios.get('https://news.ycombinator.com/')
    .then((response) => {
      const $ = cheerio.load(response.data);
      const links = [];
      $('.title a[href^="http"], a[href^="https"]').slice(1).each((index, element) => {
        links.push($(element));
      });
      res.render('api/scraping', {
        title: 'Web Scraping',
        links
      });
    })
    .catch((error) => next(error));
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = async (req, res, next) => {
  const github = new Octokit();
  try {
    const { data: repo } = await github.repos.get({ owner: 'sahat', repo: 'hackathon-starter' });
    res.render('api/github', {
      title: 'GitHub API',
      repo
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuickbooks = (req, res) => {
  const token = req.user.tokens.find((token) => token.kind === 'quickbooks');
  const realmId = req.user.quickbooks;
  const quickbooksAPIMinorVersion = 65;
  const AccountingBaseUrl = 'https://sandbox-quickbooks.api.intuit.com';

  const query = 'select * from Customer';
  const url = `${AccountingBaseUrl}/v3/company/${realmId}/query?query=${query}&minorversion=${quickbooksAPIMinorVersion}`;
  /* eslint-disable */
  // Example urls not supported by the current pug view. See Intuit's API explorer for more info.
  // const url = `${AccountingBaseUrl}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=${quickbooksAPIMinorVersion}`;
  // const url = `${AccountingBaseUrl}/v3/company/${realmId}/reports/CustomerBalance?minorversion=${quickbooksAPIMinorVersion}`;
  /* eslint-enable */

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token.accessToken}`
  };

  const options = {
    url,
    method: 'GET',
    headers
  };

  axios(options).then((customers) => {
    res.render('api/quickbooks', {
      title: 'Quickbooks API',
      customers: customers.data.QueryResponse.Customer
    });
  });
};

/**
 * GET /api/nyt
 * New York Times API example.
 */
exports.getNewYorkTimes = (req, res, next) => {
  const apiKey = process.env.NYT_KEY;
  axios.get(`http://api.nytimes.com/svc/books/v2/lists?list-name=young-adult&api-key=${apiKey}`)
    .then((response) => {
      const books = response.data.results;
      res.render('api/nyt', {
        title: 'New York Times API',
        books
      });
    })
    .catch((err) => {
      const message = JSON.stringify(err.response.data.fault);
      next(new Error(`New York Times API - ${err.response.status} ${err.response.statusText} ${message}`));
    });
};

/**
 * GET /api/lastfm
 * Last.fm API example.
 */
exports.getLastfm = async (req, res, next) => {
  const lastfm = new LastFmNode({
    api_key: process.env.LASTFM_KEY,
    secret: process.env.LASTFM_SECRET
  });
  const getArtistInfo = () =>
    new Promise((resolve, reject) => {
      lastfm.request('artist.getInfo', {
        artist: 'Roniit',
        handlers: {
          success: resolve,
          error: reject
        }
      });
    });
  const getArtistTopTracks = () =>
    new Promise((resolve, reject) => {
      lastfm.request('artist.getTopTracks', {
        artist: 'Roniit',
        handlers: {
          success: ({ toptracks }) => {
            resolve(toptracks.track.slice(0, 10));
          },
          error: reject
        }
      });
    });
  const getArtistTopAlbums = () =>
    new Promise((resolve, reject) => {
      lastfm.request('artist.getTopAlbums', {
        artist: 'Roniit',
        handlers: {
          success: ({ topalbums }) => {
            resolve(topalbums.album.slice(0, 3));
          },
          error: reject
        }
      });
    });
  try {
    const { artist: artistInfo } = await getArtistInfo();
    const topTracks = await getArtistTopTracks();
    const topAlbums = await getArtistTopAlbums();
    const artist = {
      name: artistInfo.name,
      image: artistInfo.image ? artistInfo.image.slice(-1)[0]['#text'] : null,
      tags: artistInfo.tags ? artistInfo.tags.tag : [],
      bio: artistInfo.bio ? artistInfo.bio.summary : '',
      stats: artistInfo.stats,
      similar: artistInfo.similar ? artistInfo.similar.artist : [],
      topTracks,
      topAlbums
    };
    res.render('api/lastfm', {
      title: 'Last.fm API',
      artist
    });
  } catch (err) {
    if (err.error !== undefined) {
      console.error(err);
      // see error code list: https://www.last.fm/api/errorcodes
      switch (err.error) {
        // potentially handle each code uniquely
        case 10: // Invalid API key
          res.render('api/lastfm', {
            error: err
          });
          break;
        default:
          res.render('api/lastfm', {
            error: err
          });
      }
    } else {
      next(err);
    }
  }
};

/**
 * GET /api/steam
 * Steam API example.
 */
exports.getSteam = async (req, res, next) => {
  const steamId = req.user.steam;
  const params = { l: 'english', steamid: steamId, key: process.env.STEAM_KEY };

  // makes a url with search query
  const makeURL = (baseURL, params) => {
    const url = new URL(baseURL);
    const urlParams = new URLSearchParams(params);
    url.search = urlParams.toString();
    return url.toString();
  };
  // get the list of the recently played games, pick the most recent one and get its achievements
  const getPlayerAchievements = () => {
    const recentGamesURL = makeURL('http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/', params);
    return axios.get(recentGamesURL)
      .then(({ data }) => {
        // handle if player owns no games
        if (Object.keys(data.response).length === 0) {
          return null;
        }
        // handle if there are no recently played games
        if (data.response.total_count === 0) {
          return null;
        }
        params.appid = data.response.games[0].appid;
        const achievementsURL = makeURL('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/', params);
        return axios.get(achievementsURL)
          .then(({ data }) => {
            // handle if there are no achievements for most recent game
            if (!data.playerstats.achievements) {
              return null;
            }
            return data.playerstats;
          });
      })
      .catch((err) => {
        if (err.response) {
          // handle private profile or invalid key
          if (err.response.status === 403) {
            return null;
          }
        }
        return Promise.reject(new Error('There was an error while getting achievements'));
      });
  };
  const getPlayerSummaries = () => {
    params.steamids = steamId;
    const url = makeURL('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', params);
    return axios.get(url)
      .then(({ data }) => data)
      .catch(() => Promise.reject(new Error('There was an error while getting player summary')));
  };
  const getOwnedGames = () => {
    params.include_appinfo = 1;
    params.include_played_free_games = 1;
    const url = makeURL('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', params);
    return axios.get(url)
      .then(({ data }) => data)
      .catch(() => Promise.reject(new Error('There was an error while getting owned games')));
  };
  try {
    const playerstats = await getPlayerAchievements();
    const playerSummaries = await getPlayerSummaries();
    const ownedGames = await getOwnedGames();
    res.render('api/steam', {
      title: 'Steam Web API',
      ownedGames: ownedGames.response,
      playerAchievements: playerstats,
      playerSummary: playerSummaries.response.players[0]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/stripe
 * Stripe API example.
 */
exports.getStripe = (req, res) => {
  res.render('api/stripe', {
    title: 'Stripe API',
    publishableKey: process.env.STRIPE_PKEY
  });
};

/**
 * POST /api/stripe
 * Make a payment.
 */
exports.postStripe = (req, res) => {
  const { stripeToken, stripeEmail } = req.body;
  stripe.charges.create({
    amount: 395,
    currency: 'usd',
    source: stripeToken,
    description: stripeEmail
  }, (err) => {
    if (err && err.type === 'StripeCardError') {
      req.flash('errors', { msg: 'Your card has been declined.' });
      return res.redirect('/api/stripe');
    }
    req.flash('success', { msg: 'Your card has been successfully charged.' });
    res.redirect('/api/stripe');
  });
};

/**
 * GET /api/twilio
 * Twilio API example.
 */
exports.getTwilio = (req, res) => {
  res.render('api/twilio', {
    title: 'Twilio API'
  });
};

/**
 * POST /api/twilio
 * Send a text message using Twilio.
 */
exports.postTwilio = (req, res, next) => {
  const validationErrors = [];
  if (validator.isEmpty(req.body.number)) validationErrors.push({ msg: 'Phone number is required.' });
  if (validator.isEmpty(req.body.message)) validationErrors.push({ msg: 'Message cannot be blank.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/api/twilio');
  }

  const message = {
    to: req.body.number,
    from: '+13472235148',
    body: req.body.message
  };
  twilio.messages.create(message).then((sentMessage) => {
    req.flash('success', { msg: `Text send to ${sentMessage.to}` });
    res.redirect('/api/twilio');
  }).catch(next);
};

/**
 * Get /api/twitch
 */
exports.getTwitch = async (req, res, next) => {
  const token = req.user.tokens.find((token) => token.kind === 'twitch');
  const twitchID = req.user.twitch;
  const twitchClientID = process.env.TWITCH_CLIENT_ID;

  const getUser = (userID) =>
    axios.get(`https://api.twitch.tv/helix/users?id=${userID}`, { headers: { Authorization: `Bearer ${token.accessToken}`, 'Client-ID': twitchClientID } })
      .then(({ data }) => data)
      .catch((err) => Promise.reject(new Error(`There was an error while getting user data ${err}`)));
  const getFollowers = () =>
    axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${twitchID}`, { headers: { Authorization: `Bearer ${token.accessToken}`, 'Client-ID': twitchClientID } })
      .then(({ data }) => data)
      .catch((err) => Promise.reject(new Error(`There was an error while getting followers ${err}`)));

  try {
    const yourTwitchUser = await getUser(twitchID);
    const otherTwitchUser = await getUser(44322889);
    const twitchFollowers = await getFollowers();
    res.render('api/twitch', {
      title: 'Twitch API',
      yourTwitchUserData: yourTwitchUser.data[0],
      otherTwitchUserData: otherTwitchUser.data[0],
      twitchFollowers,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/chart
 * Chart example.
 */
exports.getChart = async (req, res, next) => {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=MSFT&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
  axios.get(url)
    .then((response) => {
      const arr = response.data['Time Series (Daily)'];
      let dates = [];
      let closing = []; // stock closing value
      const keys = Object.getOwnPropertyNames(arr);
      for (let i = 0; i < 100; i++) {
        dates.push(keys[i]);
        closing.push(arr[keys[i]]['4. close']);
      }
      // reverse so dates appear from left to right
      dates.reverse();
      closing.reverse();
      dates = JSON.stringify(dates);
      closing = JSON.stringify(closing);
      res.render('api/chart', {
        title: 'Chart',
        dates,
        closing
      });
    }).catch((err) => {
      next(err);
    });
};

/**
 * GET /api/instagram
 * Instagram API example.
 */
exports.getInstagram = async (req, res, next) => {
  const token = req.user.tokens.find((token) => token.kind === 'instagram');
  ig.use({ client_id: process.env.INSTAGRAM_ID, client_secret: process.env.INSTAGRAM_SECRET });
  ig.use({ access_token: token.accessToken });
  try {
    const userSelfMediaRecentAsync = promisify(ig.user_self_media_recent);
    const myRecentMedia = await userSelfMediaRecentAsync();
    res.render('api/instagram', {
      title: 'Instagram API',
      myRecentMedia
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/paypal
 * PayPal SDK example.
 */
exports.getPayPal = (req, res, next) => {
  paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_ID,
    client_secret: process.env.PAYPAL_SECRET
  });

  const paymentDetails = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: `${process.env.BASE_URL}/api/paypal/success`,
      cancel_url: `${process.env.BASE_URL}/api/paypal/cancel`
    },
    transactions: [{
      description: 'Hackathon Starter',
      amount: {
        currency: 'USD',
        total: '1.99'
      }
    }]
  };

  paypal.payment.create(paymentDetails, (err, payment) => {
    if (err) { return next(err); }
    const { links, id } = payment;
    req.session.paymentId = id;
    for (let i = 0; i < links.length; i++) {
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
exports.getPayPalSuccess = (req, res) => {
  const { paymentId } = req.session;
  const paymentDetails = { payer_id: req.query.PayerID };
  paypal.payment.execute(paymentId, paymentDetails, (err) => {
    res.render('api/paypal', {
      result: true,
      success: !err
    });
  });
};

/**
 * GET /api/paypal/cancel
 * PayPal SDK example.
 */
exports.getPayPalCancel = (req, res) => {
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
exports.getLob = async (req, res, next) => {
  const config = new LobConfiguration({
    username: process.env.LOB_KEY,
  });

  let recipientName;
  if (req.user) { recipientName = req.user.profile.name; } else { recipientName = 'John Doe'; }
  const addressTo = {
    name: recipientName || 'Developer',
    address_line1: '123 Main Street',
    address_city: 'New York',
    address_state: 'NY',
    address_zip: '94107'
  };
  const addressFrom = {
    name: 'Hackathon Starter',
    address_line1: '305 Harrison St',
    address_city: 'Seattle',
    address_state: 'WA',
    address_zip: '98109',
    address_country: 'US'
  };

  const zipData = new ZipEditable({
    zip_code: addressTo.address_zip
  });

  const letterData = new LetterEditable({
    use_type: 'operational',
    to: addressTo,
    from: addressFrom,
    // file: minified version of https://github.com/lob/lob-node/blob/master/examples/html/letter.html with slight changes as an example
    file: `<html><head><meta charset="UTF-8"><style>body{width:8.5in;height:11in;margin:0;padding:0}.page{page-break-after:always;position:relative;width:8.5in;height:11in}.page-content{position:absolute;width:8.125in;height:10.625in;left:1in;top:1in}.text{position:relative;left:20px;top:3in;width:6in;font-size:14px}</style></head>
          <body><div class="page"><div class="page-content"><div class="text">
          Hello ${addressTo.name}, <p> We would like to welcome you to the community! Thanks for being a part of the team! <p><p> Cheer,<br>${addressFrom.name}
          </div></div></div></body></html>`,
    color: false
  });

  try {
    const uspsLetter = await new LettersApi(config).create(letterData);
    const zipDetails = await new ZipLookupsApi(config).lookup(zipData);
    res.render('api/lob', {
      title: 'Lob API',
      zipDetails,
      uspsLetter,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/upload
 * File Upload API example.
 */

exports.getFileUpload = (req, res) => {
  res.render('api/upload', {
    title: 'File Upload'
  });
};

exports.postFileUpload = (req, res) => {
  req.flash('success', { msg: 'File was uploaded successfully.' });
  res.redirect('/api/upload');
};

/**
 * GET /api/pinterest
 * Pinterest API example.
 */
exports.getPinterest = (req, res, next) => {
  const token = req.user.tokens.find((token) => token.kind === 'pinterest');
  axios.get(`https://api.pinterest.com/v1/me/boards?access_token=${token.accessToken}`)
    .then((response) => {
      res.render('api/pinterest', {
        title: 'Pinterest API',
        boards: response.data.data
      });
    })
    .catch((error) => {
      next(error);
    });
};
/**
 * POST /api/pinterest
 * Create a pin.
 */
exports.postPinterest = (req, res, next) => {
  const validationErrors = [];
  if (validator.isEmpty(req.body.board)) validationErrors.push({ msg: 'Board is required.' });
  if (validator.isEmpty(req.body.note)) validationErrors.push({ msg: 'Note cannot be blank.' });
  if (validator.isEmpty(req.body.image_url)) validationErrors.push({ msg: 'Image URL cannot be blank.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/api/pinterest');
  }

  const token = req.user.tokens.find((token) => token.kind === 'pinterest');
  const formData = {
    board: req.body.board,
    note: req.body.note,
    link: req.body.link,
    image_url: req.body.image_url
  };

  axios.post(`https://api.pinterest.com/v1/pins/?access_token=${token.accessToken}`, formData)
    .then(() => {
      req.flash('success', { msg: 'Pin created' });
      res.redirect('/api/pinterest');
    })
    .catch((error) => {
      req.flash('errors', { msg: error.response.data.message });
      res.redirect('/api/pinterest');
    });
};

exports.getHereMaps = (req, res) => {
  res.render('api/here-maps', {
    app_id: process.env.HERE_APP_ID,
    app_code: process.env.HERE_APP_CODE,
    title: 'Here Maps API'
  });
};

exports.getGoogleMaps = (req, res) => {
  res.render('api/google-maps', {
    title: 'Google Maps API',
    google_map_api_key: process.env.GOOGLE_MAP_API_KEY
  });
};

exports.getGoogleDrive = (req, res) => {
  const token = req.user.tokens.find((token) => token.kind === 'google');
  const authObj = new googledrive.auth.OAuth2({
    access_type: 'offline'
  });
  authObj.setCredentials({
    access_token: token.accessToken
  });
  const drive = googledrive.drive({
    version: 'v3',
    auth: authObj
  });

  drive.files.list({
    fields: 'files(iconLink, webViewLink, name)'
  }, (err, response) => {
    if (err) return console.log(`The API returned an error: ${err}`);
    res.render('api/google-drive', {
      title: 'Google Drive API',
      files: response.data.files,
    });
  });
};

exports.getGoogleSheets = (req, res) => {
  const token = req.user.tokens.find((token) => token.kind === 'google');
  const authObj = new googlesheets.auth.OAuth2({
    access_type: 'offline'
  });
  authObj.setCredentials({
    access_token: token.accessToken
  });

  const sheets = googlesheets.sheets({
    version: 'v4',
    auth: authObj
  });

  const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
  const re = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const id = url.match(re)[1];

  sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: 'Class Data!A1:F',
  }, (err, response) => {
    if (err) return console.log(`The API returned an error: ${err}`);
    res.render('api/google-sheets', {
      title: 'Google Sheets API',
      values: response.data.values,
    });
  });
};
