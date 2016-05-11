import path from 'path';
import express from 'express';
import ReactDOMServer from 'react-dom/server'
import moment from 'moment'

import presence from './lib/presence'
import Page from './views'
import React from 'react'

const app = express();
const stylesDir = path.join(__dirname, 'styles');
const publicDir = path.join(__dirname, 'public');

app.locals.compileDebug = false;

import stylus from 'stylus';
app.use(stylus.middleware({src: stylesDir, dest: publicDir}));

import autoprefixer from 'express-autoprefixer';
app.use(autoprefixer({browsers: 'last 2 versions', cascade: false}));

app.use(express.static('build'));

// respond with rendered html
app.get('/', function(req, res, next) {
    let date;
    if (req.query.date) {
        date = moment(req.query.date);
        if (!date.isValid()) date = null;
    }
    if (!date) date = moment();
    date = date.locale('de_DE').startOf('day');

    let framed = !!req.query.framed;

    presence(date).then((teams) => {
        let props = {
            teams,
            framed,
            date: date.format('YYYY-MM-DD')
        };

        let pageElement = React.createElement(Page, props);
        let html = ReactDOMServer.renderToString(pageElement);
        res.send('<!DOCTYPE html>' + html);
    }).catch(next);
});

app.use(express.static(publicDir));

let port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port}...`));

