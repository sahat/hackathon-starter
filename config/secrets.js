/**
 * IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT
 *
 * You should never commit this file to a public repository on GitHub!
 * All public code on GitHub can be searched, that means anyone can see your
 * uploaded secrets.js file.
 *
 * I did it for your convenience using "throw away" API keys and passwords so
 * that all features could work out of the box.
 *
 * Use config vars (environment variables) below for production API keys
 * and passwords. Each PaaS (e.g. Heroku, Nodejitsu, OpenShift, Azure) has a way
 * for you to set it up from the dashboard.
 *
 * Another added benefit of this approach is that you can use two different
 * sets of keys for local development and production mode without making any
 * changes to the code.

 * IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT  IMPORTANT
 */

module.exports = {

  db: process.env.MONGODB || 'mongodb://localhost:27017/test',
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',

  sessionSecret: process.env.SESSION_SECRET || 'Your Session Secret goes here',
  
  cryptAlgorithm: process.env.CRYPT_ALGORITHM || 'aes-256-ctr',
  cryptPassword: process.env.CRYPT_PASSWORD || 'some-password',

  mandrill: {
    user: process.env.MANDRILL_USER || 'volahnteer@gmail.com',
    password: process.env.MANDRILL_PASSWORD || 'LDZo3hEJFGLZzqJIV-9zlg'
  },

  paypal: {
    host: 'api.sandbox.paypal.com',
    // client_id: process.env.PAYPAL_ID || 'AdGE8hDyixVoHmbhASqAThfbBcrbcgiJPBwlAM7u7Kfq3YU-iPGc6BXaTppt',
    // client_secret: process.env.PAYPAL_SECRET || 'EPN0WxB5PaRaumTB1ZpCuuTqLqIlF6_EWUcAbZV99Eu86YeNBVm9KVsw_Ez5',
    client_id: process.env.PAYPAL_ID || 'AUwpVAZyvPlrlocY50yrHt3Wj9lxKFbzrmxt_X6rXpnWL3jGvr5C0i_qJu7j4pddTDUXgyyxX2336g5w',
    client_secret: process.env.PAYPAL_SECRET || 'EC3Hoov1Fn6FQ_3YHe4oRRlAk0xgep7i1dWpqH-Lh97JipKGQYHcz_l32nc1IbBDVMLnF7kZRv-X8zyt',
    returnUrl: process.env.PAYPAL_RETURN_URL || 'http://localhost:3000/api/paypal/success',
    cancelUrl: process.env.PAYPAL_CANCEL_URL || 'http://localhost:3000/api/paypal/cancel'
  },

  lob: {
    apiKey: process.env.LOB_KEY || 'test_814e892b199d65ef6dbb3e4ad24689559ca'
  }
};
