const autoprefixer = require('autoprefixer')

module.exports = {
  context: `${__dirname}/lib`,
  entry: { edit: './input-date', auto: './follow-the-sun', subpage: './subpage' },
  resolve: {
    extensions: ['', '.jsx', '.js'],
  },
  output: {
    path: `${__dirname}/build`,
    filename: '[name].js',
  },
  module: {
    postLoaders: [
      {
        test: /\.styl$/,
        loaders: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
    loaders: [
      {
        test: /\.js|\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: { presets: ['es2015', 'react'] },
      },
      { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' },
      {
        test: /\.styl$/,
        loader: 'stylus-loader',
        query: {
          sourceMap: true,
          requireSyntax: true,
          'resolve url': true,
        },
      },
    ],
  },
  postcss() {
    return [autoprefixer({ browsers: ['last 2 versions', 'Firefox 15'] })]
  },
  devtool: 'source-map',
}
