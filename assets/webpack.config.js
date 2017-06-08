const path = require('path');

module.exports = {
    entry: ['babel-polyfill', './js/index.js'],
    output: {
        path: path.resolve(__dirname, '/priv/static'),
        filename: 'js/[name].js',
        publicPath: 'http://localhost:8080/',
    },
    module: {
        loaders: [
            {
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: [
                        ['es2015', { modules: false }],
                        'stage-0',
                        'react',
                    ],
                },
            },
        ],
    },
};
