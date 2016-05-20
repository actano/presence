import express from 'express';
import ReactDOMServer from 'react-dom/server'
import moment from 'moment'
import socketio from 'socket.io'

import presence from './lib/presence'
import Page from './lib/views'
import React from 'react'
import config from './lib/config'

const app = express();

app.locals.compileDebug = false;

app.use(express.static('build'));

function getDate(dateParam) {
    let date;
    if (dateParam) {
        date = moment(dateParam);
        if (!date.isValid()) date = null;
    }
    if (!date) date = moment();
    date = date.locale('de_DE').startOf('day');
    return date;
}

app.get('/', function(req, res, next) {

    function html() {
        let date = getDate(req.query.date);
        let framed = !!req.query.framed;

        let props = {
            framed,
            date: date.format('YYYY-MM-DD')
        };

        let pageElement = React.createElement(Page, props);
        let html = ReactDOMServer.renderToString(pageElement);
        res.send('<!DOCTYPE html>' + html);
    }

    function json() {
        let date = getDate(req.query.date);
        let _config = config(date);
        presence(date).then((teams) => {
            res.send({
                teams: teams,
                gravatarPrefix: _config.gravatarPrefix,
                emailSuffix: _config.emailSuffix
            });
        }).catch(next);
    }

    res.format({
        'text/html': html,
        'application/json': json,
        'default': html
    });
});

let port = process.env.PORT || 3000;

const server = app.listen(port, () => console.log(`Listening on port ${port}...`));
const io = socketio(server, {serveClient: false, path: '/rt'});
io.on('connection', (client) => {
    client.on('date', (date) => {
        date = getDate(date);
        let _config = config(date);
        presence(date).then((teams) => {
            client.emit('teams', {
                date: date.format('YYYY-MM-DD'),
                teams: teams,
                gravatarPrefix: _config.gravatarPrefix,
                emailSuffix: _config.emailSuffix
            });
        });
    });
});

// dumb pushing out of update events every 5 minutes
setInterval(()=> {
    io.emit('update')
}, 5 * 60 * 1000);

