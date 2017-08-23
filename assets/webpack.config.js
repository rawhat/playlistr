const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './elm/index.js',
  },
  output: {
    path: path.resolve(__dirname, '/static'),
    filename: 'js/[name].js',
    publicPath: 'http://192.168.125.104:8080/',
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
        to: path.resolve(__dirname, '../static'),
      },
    ]),
  ],
  resolve: {
    modules: [ "node_modules", __dirname + "/web/static/js", __dirname + "/deps" ]
  }
};
