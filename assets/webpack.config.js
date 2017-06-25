const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

console.log(path.resolve(__dirname, '../deps'));

module.exports = {
    entry: {
        main: './js/index.js'
    },
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
                to: path.resolve(__dirname, '../priv/static'),
            },
        ]),
    ],
};
