module.exports = {
  spotify: {
    clientID: process.env.SPOTIFY_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/spotify/callback`,
  },
};
