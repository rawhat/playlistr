const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './elm/index.js',
  },
  output: {
    path: path.resolve(__dirname, '/priv/static'),
    filename: 'js/[name].js',
    publicPath: 'http://localhost:8080/',
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  module: {
    rules: [
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: 'elm-webpack-loader',
        options: {
          verbose: true,
          warn: true,
          debug: true,
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: './static',
        to: path.resolve(__dirname, '../priv/static'),
      },
    ]),
  ],
};
