const crypto = require('crypto');
const cheerio = require('cheerio');
const { LastFmNode } = require('lastfm');
const { OAuth } = require('oauth');
// Disable eslint rule for @octakit/rest until the following github issue is resolved
// github npm package bug: https://github.com/octokit/rest.js/issues/446
// eslint-disable-next-line import/no-unresolved
const { Octokit } = require('@octokit/rest');
const stripe = require('stripe')(process.env.STRIPE_SKEY);
const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
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
  try {
    const headers = {
      Authorization: `${process.env.FOURSQUARE_APIKEY}`
    };

    const [trendingVenuesRes, venueDetailRes, venuePhotosRes] = await Promise.all([
      axios.get('https://api.foursquare.com/v3/places/search?ll=47.609657,-122.342148&limit=10', { headers }),
      axios.get('https://api.foursquare.com/v3/places/427ea800f964a520b1211fe3', { headers }),
      axios.get('https://api.foursquare.com/v3/places/427ea800f964a520b1211fe3/photos', { headers })
    ]);
    const trendingVenues = trendingVenuesRes.data.results;
    const venueDetail = venueDetailRes.data;
    const venuePhotos = venuePhotosRes.data.slice(0, 9); // Limit the photos to 9
    res.render('api/foursquare', {
      title: 'Foursquare API (v3)',
      trendingVenues,
      venueDetail,
      venuePhotos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tumblr
 * Tumblr API example (Authenticated request using OAuth 1.0a).
 */
exports.getTumblr = async (req, res, next) => {
  const token = req.user.tokens.find((token) => token.kind === 'tumblr');
  if (!token) throw new Error('No Tumblr token found for user.');

  // Helper function to generate the OAuth 1.0a authHeader for Tumblr API.
  // This function is not going to making any actual calls to
  // tumblr's /request_token or /access_token endpoints.
  function getTumblrAuthHeader(url, method) {
    const oauth = new OAuth('https://www.tumblr.com/oauth/request_token',
      'https://www.tumblr.com/oauth/access_token',
      process.env.TUMBLR_KEY,
      process.env.TUMBLR_SECRET,
      '1.0A',
      null,
      'HMAC-SHA1');
    return oauth.authHeader(url, token.accessToken, token.tokenSecret, method);
  }

  try {
    // Fetch user info - requires OAuth
    const userInfoURL = 'https://api.tumblr.com/v2/user/info';
    const userUnfoResponse = await axios.get(userInfoURL,
      { headers: { Authorization: getTumblrAuthHeader(userInfoURL, 'GET') } });

    // Fetch blog posts (public API, doesn't require OAuth)
    const blogId = 'peacecorps.tumblr.com';
    const postType = 'photo';
    const blogResponse = await axios.get(`https://api.tumblr.com/v2/blog/${blogId}/posts/${postType}?api_key=${process.env.TUMBLR_KEY}`);

    res.render('api/tumblr', {
      title: 'Tumblr API',
      userInfo: userUnfoResponse.data.response.user,
      blog: blogResponse.data.response.blog,
      photoset: blogResponse.data.response.posts[0].photos,
    });
  } catch (error) {
    next(error);
  }
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
  const limit = 10;
  let authFailure = 'NotFetched';
  if (!req.user) {
    authFailure = 'NotLoggedIn';
  } else if (!req.user.tokens || !req.user.tokens.find((token) => token.kind === 'github')) {
    authFailure = 'NotGitHubAuthorized';
  }
  const githubToken = (req.user && req.user.tokens && req.user.tokens.find((token) => token.kind === 'github')) ? req.user.tokens.find((token) => token.kind === 'github').accessToken : null;

  let github;
  let userInfo;
  let userRepos;
  let userEvents;
  if (githubToken) {
    github = new Octokit({ auth: req.user.tokens.find((token) => token.kind === 'github').accessToken });
    try {
      ({ data: userInfo } = await github.request('/user'));
      ({ data: userRepos } = await github.repos.listForAuthenticatedUser({ per_page: limit }));
      ({ data: userEvents } = await github.activity.listEventsForAuthenticatedUser({
        username: userInfo.login,
        per_page: limit
      }));
    } catch (error) {
      next(error);
    }
  } else {
    // If the user is not logged in or doesn't have a Github account
    // we can still get some data from the public APIs such as some public repo infos
    github = new Octokit();
  }

  try {
    const { data: repo } = await github.repos.get({ owner: 'sahat', repo: 'hackathon-starter' });
    const { data: repoStargazers } = await github.activity.listStargazersForRepo({
      owner: 'sahat',
      repo: 'hackathon-starter',
      per_page: limit
    });

    res.render('api/github', {
      title: 'GitHub API',
      repo,
      userInfo,
      userRepos,
      userEvents,
      repoStargazers,
      limit,
      authFailure,
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
    console.log('See error codes at: https://www.last.fm/api/errorcodes');
    console.log(err);
    next(err);
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

// Twilio Sandbox numbers https://www.twilio.com/docs/iam/test-credentials
const sandboxNumbers = ['+15005550001',
  '+15005550002',
  '+15005550003',
  '+15005550004',
  '+15005550006',
  '+15005550007',
  '+15005550008',
  '+15005550009'];

/**
 * GET /api/twilio
 * Twilio API example.
 */
exports.getTwilio = (req, res) => {
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const isSandbox = sandboxNumbers.includes(fromNumber);

  res.render('api/twilio', {
    title: 'Twilio API',
    fromNumber,
    isSandbox,
    sandboxInfoUrl: 'https://www.twilio.com/docs/iam/test-credentials#test-sms-numbers', // Twilio sandbox info link
  });
};

/**
 * POST /api/twilio
 * Send a text message (sandbox or live mode).
 */
exports.postTwilio = async (req, res) => {
  const validationErrors = [];
  if (!req.body.number || validator.isEmpty(req.body.number)) {
    validationErrors.push({ msg: 'Phone number is required.' });
  }
  if (!req.body.message || validator.isEmpty(req.body.message)) {
    validationErrors.push({ msg: 'Message cannot be blank.' });
  }

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/api/twilio');
  }

  const message = {
    to: req.body.number,
    from: process.env.TWILIO_FROM_NUMBER,
    body: req.body.message,
  };

  try {
    // Attempt to send the SMS using Twilio
    const sentMessage = await twilioClient.messages.create(message);
    req.flash('success', { msg: `Text sent successfully to ${sentMessage.to}` });
    return res.redirect('/api/twilio');
  } catch (error) {
    // Log the raw error to the console for developers
    console.error('Twilio API Error:', error);

    // Map known error codes to user-friendly messages
    const errorMessages = {
      21212: 'The "From" phone number is invalid.',
      21606: 'The "From" phone number is not owned by your account or is not SMS-capable.',
      21611: 'The "From" phone number has an SMS message queue that is full.',
      21211: 'The "To" phone number is invalid.',
      21612: 'We cannot route a message to this number.',
      21408: 'The "To" phone number is international, and we cannot send international messages at this time.',
      21614: 'The "To" phone number is incapable of receiving SMS messages.',
      21610: 'The "To" phone number has been unsubscribed and we can not send messages to it from your account.',
    };

    // Determine the user-friendly error message or send a generic error if not found in our list
    const friendlyMessage = error.code && errorMessages[error.code]
      ? errorMessages[error.code]
      : 'An error occurred while sending the message. Please try again later.';

    // Flash the user-friendly message
    req.flash('errors', { msg: friendlyMessage });
    return res.redirect('/api/twilio');
  }
};

/**
 * Get /api/twitch
 */
exports.getTwitch = async (req, res, next) => {
  const token = req.user.tokens.find((token) => token.kind === 'twitch');
  const twitchID = req.user.twitch;
  const twitchClientID = process.env.TWITCH_CLIENT_ID;

  const getUser = (userID) =>
    axios.get(`https://api.twitch.tv/helix/users?id=${userID}`, {
      headers: { Authorization: `Bearer ${token.accessToken}`, 'Client-ID': twitchClientID }
    })
      .then(({ data }) => data)
      .catch((err) => Promise.reject(new Error(`There was an error while getting user data ${err}`)));

  const getFollowers = (userID) =>
    axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userID}`, {
      headers: { Authorization: `Bearer ${token.accessToken}`, 'Client-ID': twitchClientID }
    })
      .then(({ data }) => data)
      .catch((err) => Promise.reject(new Error(`There was an error while getting followers ${err}`)));

  const getStreams = (gameID) =>
    axios.get(`https://api.twitch.tv/helix/streams?game_id=${gameID}`, {
      headers: { Authorization: `Bearer ${token.accessToken}`, 'Client-ID': twitchClientID }
    })
      .then(({ data }) => data)
      .catch((err) => Promise.reject(new Error(`There was an error while getting streams ${err}`)));

  const getUserByLogin = (loginID) =>
    axios.get(`https://api.twitch.tv/helix/users?login=${loginID}`, {
      headers: { Authorization: `Bearer ${token.accessToken}`, 'Client-ID': twitchClientID }
    })
      .then(({ data }) => data)
      .catch((err) => Promise.reject(new Error(`There was an error while getting user info by login ${err}`)));

  try {
    const yourTwitchUser = await getUser(twitchID);
    const twitchFollowers = await getFollowers(twitchID);
    const streams = await getStreams('497057'); // lookup streams for Destiny 2, which is game_id 497057
    const topStream = streams.data[0];
    const topStreamerInfo = await getUserByLogin(topStream.user_login);
    res.render('api/twitch', {
      title: 'Twitch API',
      yourTwitchUserData: yourTwitchUser.data[0] || {},
      otherTwitchUserData: {},
      otherTwitchStreamStatus: streams.data[0] || {},
      otherTwitchStreamerInfo: topStreamerInfo.data[0] || {},
      twitchFollowers: twitchFollowers || {}
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
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
  axios.get(url)
    .then((response) => {
      const stockdata = response.data['Time Series (Daily)'];
      let dates = [];
      let closing = []; // stock closing value
      let keys;
      let dataType;
      if (stockdata === undefined) {
        dataType = 'Unable to get live data from Alpha Vantage. Using previously downloaded data:';
        console.log(response.data);
        dates = [
          '2023-03-02', '2023-03-03', '2023-03-06', '2023-03-07', '2023-03-08', '2023-03-09', '2023-03-10', '2023-03-13', '2023-03-14', '2023-03-15',
          '2023-03-16', '2023-03-17', '2023-03-20', '2023-03-21', '2023-03-22', '2023-03-23', '2023-03-24', '2023-03-27', '2023-03-28', '2023-03-29',
          '2023-03-30', '2023-03-31', '2023-04-03', '2023-04-04', '2023-04-05', '2023-04-06', '2023-04-10', '2023-04-11', '2023-04-12', '2023-04-13',
          '2023-04-14', '2023-04-17', '2023-04-18', '2023-04-19', '2023-04-20', '2023-04-21', '2023-04-24', '2023-04-25', '2023-04-26', '2023-04-27',
          '2023-04-28', '2023-05-01', '2023-05-02', '2023-05-03', '2023-05-04', '2023-05-05', '2023-05-08', '2023-05-09', '2023-05-10', '2023-05-11',
          '2023-05-12', '2023-05-15', '2023-05-16', '2023-05-17', '2023-05-18', '2023-05-19', '2023-05-22', '2023-05-23', '2023-05-24', '2023-05-25',
          '2023-05-26', '2023-05-30', '2023-05-31', '2023-06-01', '2023-06-02', '2023-06-05', '2023-06-06', '2023-06-07', '2023-06-08', '2023-06-09',
          '2023-06-12', '2023-06-13', '2023-06-14', '2023-06-15', '2023-06-16', '2023-06-20', '2023-06-21', '2023-06-22', '2023-06-23', '2023-06-26',
          '2023-06-27', '2023-06-28', '2023-06-29', '2023-06-30', '2023-07-03', '2023-07-05', '2023-07-06', '2023-07-07', '2023-07-10', '2023-07-11',
          '2023-07-12', '2023-07-13', '2023-07-14', '2023-07-17', '2023-07-18', '2023-07-19', '2023-07-20', '2023-07-21', '2023-07-24', '2023-07-25'
        ];
        closing = [
          '251.1100', '255.2900', '256.8700', '254.1500', '253.7000', '252.3200', '248.5900', '253.9200', '260.7900', '265.4400', '276.2000', '279.4300',
          '272.2300', '273.7800', '272.2900', '277.6600', '280.5700', '276.3800', '275.2300', '280.5100', '284.0500', '288.3000', '287.2300', '287.1800',
          '284.3400', '291.6000', '289.3900', '282.8300', '283.4900', '289.8400', '286.1400', '288.8000', '288.3700', '288.4500', '286.1100', '285.7600',
          '281.7700', '275.4200', '295.3700', '304.8300', '307.2600', '305.5600', '305.4100', '304.4000', '305.4100', '310.6500', '308.6500', '307.0000',
          '312.3100', '310.1100', '308.9700', '309.4600', '311.7400', '314.0000', '318.5200', '318.3400', '321.1800', '315.2600', '313.8500', '325.9200',
          '332.8900', '331.2100', '328.3900', '332.5800', '335.4000', '335.9400', '333.6800', '323.3800', '325.2600', '326.7900', '331.8500', '334.2900',
          '337.3400', '348.1000', '342.3300', '338.0500', '333.5600', '339.7100', '335.0200', '328.6000', '334.5700', '335.8500', '335.0500', '340.5400',
          '337.9900', '338.1500', '341.2700', '337.2200', '331.8300', '332.4700', '337.2000', '342.6600', '345.2400', '345.7300', '359.4900', '355.0800',
          '346.8700', '343.7700', '345.1100', '350.9800'
        ];
      } else {
        dataType = 'Using data from Alpha Vantage';
        keys = Object.getOwnPropertyNames(stockdata);
        for (let i = 0; i < 100; i++) {
          dates.push(keys[i]);
          closing.push(stockdata[keys[i]]['4. close']);
        }
        // reverse so dates appear from left to right
        dates.reverse();
        closing.reverse();
      }
      dates = JSON.stringify(dates);
      closing = JSON.stringify(closing);
      res.render('api/chart', {
        dataType,
        title: 'Chart',
        dates,
        closing
      });
    }).catch((err) => {
      next(err);
    });
};

// Doing this outside of the route handler to avoid blocking the page load behind oauth.
// For this example we are tring to have a pay botton that when pressed it would initiate a payment
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const response = await axios.post('https://api.sandbox.paypal.com/v1/oauth2/token', 'grant_type=client_credentials', {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data.access_token;
}

// Constant for purchase information
const purchaseInfo = {
  description: 'Hackathon Starter',
  amount: {
    currency_code: 'USD',
    value: '1.99'
  }
};

/**
 * GET /api/paypal
 * PayPal API example without SDK.
 */
exports.getPayPal = async (req, res, next) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const paymentDetails = {
      intent: 'CAPTURE',
      purchase_units: [purchaseInfo],
      application_context: {
        brand_name: 'Hackathon Starter',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.BASE_URL}/api/paypal/success`,
        cancel_url: `${process.env.BASE_URL}/api/paypal/cancel`
      }
    };

    const response = await axios.post('https://api.sandbox.paypal.com/v2/checkout/orders', paymentDetails, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const approvalUrl = response.data.links.find((link) => link.rel === 'approve').href;
    req.session.orderId = response.data.id;
    res.render('api/paypal', { approvalUrl, purchaseInfo, title: 'Paypal API' });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/**
 * GET /api/paypal/success
 * PayPal API example without SDK.
 */
exports.getPayPalSuccess = async (req, res) => {
  try {
    const { orderId } = req.session;
    const accessToken = await getPayPalAccessToken();
    await axios.post(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.render('api/paypal', {
      result: true,
      success: true,
      purchaseInfo
    });
  } catch (err) {
    console.error(err);
    res.render('api/paypal', {
      title: 'Paypal API - Success',
      result: true,
      success: false,
      purchaseInfo
    });
  }
};

/**
 * GET /api/paypal/cancel
 * PayPal API example without SDK.
 */
exports.getPayPalCancel = (req, res) => {
  req.session.orderId = null;
  res.render('api/paypal', {
    title: 'Paypal API - Cancel',
    result: true,
    canceled: true,
    purchaseInfo
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
  const headers = { Authorization: `Bearer ${token.accessToken}` };

  axios.get('https://api.pinterest.com/v5/boards', { headers })
    .then((response) => {
      res.render('api/pinterest', {
        title: 'Pinterest API',
        boards: response.data.items
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
  const headers = { Authorization: `Bearer ${token.accessToken}` };
  const formData = {
    board_id: req.body.board,
    title: req.body.note,
    media: {
      media_type: 'image',
      url: req.body.image_url
    },
    link: req.body.link
  };

  axios.post('https://api.pinterest.com/v5/pins', formData, { headers })
    .then(() => {
      req.flash('success', { msg: 'Pin created' });
      res.redirect('/api/pinterest');
    })
    .catch((error) => {
      req.flash('errors', { msg: error.response.data.message || 'An error occurred.' });
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
