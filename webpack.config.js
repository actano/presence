const path = require('path')
const webpack = require('webpack')
const packageJson = require('./package.json')

function webpackConfig() {
  const sourceMap = true
  const context = path.join(__dirname, 'lib')
  const cssLoaders = [
    { loader: 'style-loader' },
    { loader: 'css-loader', options: { importLoaders: 1, sourceMap } },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap,
      },
    },
  ]

  const stylusLoaders = [
    ...cssLoaders,
    {
      loader: 'stylus-loader',
      options: { requireSyntax: true, 'resolve url': true, sourceMap: false },
    },
  ]

  const babelLoader = {
    loader: 'babel-loader',
    options: {
      babelrc: false,
      presets: [
        ['env', {
          targets: {
            browsers: packageJson.browserslist,
          },
        }],
        'react',
        'stage-2',
      ],
    },
  }

  const plugins = [
    new webpack.IgnorePlugin(/react\/lib\/ReactContext/),
    new webpack.NormalModuleReplacementPlugin(/^react\/addons$/, 'react'),
    new webpack.LoaderOptionsPlugin({ debug: true }),
  ]

  return {
    context,
    entry: { edit: './input-date', auto: './follow-the-sun', subpage: './subpage' },
    output: {
      path: path.join(__dirname, 'build'),
      pathinfo: true,
      filename: '[name].js',
      chunkFilename: '[id].js',
      publicPath: '/',
    },
    devtool: 'source-map',
    stats: { children: false },
    resolve: {
      modules: ['node_modules'],
      enforceExtension: false,
      extensions: ['.js', '.jsx', '.styl'],
      aliasFields: ['browser'],
    },
    target: 'web',
    node: { fs: 'empty' },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: cssLoaders,
        },
        {
          test: /\.styl$/,
          use: stylusLoaders,
        },
        {
          test: /\.coffee$/,
          use: [
            babelLoader,
            {
              loader: 'coffee-loader',
              options: {
                sourceMap,
              },
            },
          ],
        },
        {
          test: /\.ne$/,
          use: [
            babelLoader,
            { loader: 'nearley-loader' },
          ],
        },
        {
          test: /\.js$|.jsx$/,
          exclude: p => /node_modules/.test(p) && !/chai-as-promised/.test(p),
          use: [
            babelLoader,
          ],
        },
        {
          test: /\.md$/,
          use: [
            { loader: 'html-loader' },
            { loader: 'markdown-loader' },
          ],
        },
        {
          test: /\.html$/,
          use: [
            { loader: 'html-loader' },
          ],
        },
        {
          test: /\.jpg$/,
          use: [
            { loader: 'file-loader' },
          ],
        },
        {
          test: /\.png$/,
          use: [
            { loader: 'file-loader' },
          ],
        },
        // fonts/font awesome
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 10000,
                mimetype: 'application/font-woff',
              },
            },
          ],
        },
        {
          test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          use: [
            { loader: 'url-loader' },
          ],
        },
      ],
    },
    plugins,
    externals: {
      'react/addons': true,
      'react/lib/ExecutionEnvironment': true,
      'react/lib/ReactContext': true,
    },
  }
}

module.exports = webpackConfig()
