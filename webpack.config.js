module.exports = {
	entry: './src/main-page.js',
	output: {
		path: './static/js',
		filename: '[name].min.js'
	},
	module: {
		loaders: [
			{
				exclude: /node_modules/,
				loader: 'babel',
				query: {
					presets: ['es2015', 'stage-0', 'react']
				}
			}
		]
	}
};