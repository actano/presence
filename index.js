import path from 'path';
import express from 'express';
import presence from './lib/presence'
import config from './lib/config'
import Helpers from './lib/jade-helpers'
import moment from 'moment'
import Teams from './views/teams'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

const app = express();
const viewsDir  = path.join(__dirname, 'views');
const stylesDir = path.join(__dirname, 'styles');
const publicDir = path.join(__dirname, 'public');

app.set('views', viewsDir);
app.set('view engine', 'jade');

app.locals.compileDebug = false;

import stylus from 'stylus';
app.use(stylus.middleware({src: stylesDir, dest: publicDir}));

import autoprefixer from 'express-autoprefixer';
app.use(autoprefixer({browsers: 'last 2 versions', cascade: false}));

// respond with rendered html
app.get('/', function(req, res, next) {
    let date;
    if ((req.query != null) && (req.query.date != null)) {
        date = moment(req.query.date);
        if (!date.isValid()) date = null;
    }
    if (!date) date = moment();

    presence(date).then((teams) => {
        let data = new Helpers(date.locale('de'));
        data.teams = teams;
        data.gravatarUrlFromName = config.gravatarUrlFromName;
        let teamElement = React.createElement(Teams, {teams, date});
        data.react = ReactDOMServer.renderToString(teamElement);
        res.render('index', data);
    }).catch(next);
});

app.use(express.static(publicDir));

let port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port}...`));

