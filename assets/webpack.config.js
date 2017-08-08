const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        main: './js/index.js',
    },
    output: {
        path: path.resolve(__dirname, '/static'),
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
                        [
                            'es2015',
                            {
                                modules: false,
                            },
                        ],
                        'stage-0',
                        'react',
                    ],
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
    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
};
