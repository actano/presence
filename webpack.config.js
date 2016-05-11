autoprefixer = require('autoprefixer');

module.exports = {
    context: __dirname + '/lib',
    entry: './client',
    resolve: {
        extensions: ['', '.jsx', '.js']
    },
    output: {
        path: __dirname + '/build',
        filename: 'client.js'
    },
    module: {
        loaders: [
            {test: /\.js|\.jsx$/, exclude: /node_modules/, loader: "babel-loader", query: {presets: ['es2015', 'react']}},
            {test: /\.json$/, exclude: /node_modules/, loader: "json-loader"},
            {test: /\.styl$/, loader: 'style-loader!css-loader!postcss-loader!stylus-loader?{"sourceMap": true, "requireSyntax": true, "resolve url": true}'}
        ]
    },
    postcss: function(){
        return [autoprefixer({browsers: ['last 2 versions', 'Firefox 15']})]
    }
};
