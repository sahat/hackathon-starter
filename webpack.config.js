var nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './public/js/main.js',
  output: {
    filename: './public/js/bundle.js'
  },
  target: 'node',
  externals: [nodeExternals({
    whitelist: ['jquery', 'bootstrap', 'bootstrap-3-typeahead', 'moment']
  })],
  watchOptions: {
    ignored: /node_modules/
  },
  module: {
    loaders: [{
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['env']
        }
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader'
      }, // use ! to chain loaders
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192'
      } // inline base64 URLs for <=8k images, direct URLs for the rest
    ]
  }
};
