module.exports = {
	entry: ['babel-polyfill', './src/app.js'],
	output: {
		path: __dirname + '/static/js',
		filename: '[name].min.js'
	},
	module: {
		loaders: [
			{
				exclude: /node_modules/,
				loader: 'babel-loader',
				query: {
					presets: [['es2015', { modules: false }], 'stage-0', 'react']
				}
			}
		]
	}
};