import express from 'express';
import ReactDOMServer from 'react-dom/server'
import moment from 'moment'

import presence from './lib/presence'
import Page from './lib/views'
import React from 'react'

const app = express();

app.locals.compileDebug = false;

app.use(express.static('build'));

// respond with rendered html
app.get('/', function(req, res, next) {
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

    function html() {
        let date = getDate(req.query.date);
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
    }

    function json() {
        let date = getDate(req.query.date);
        presence(date).then((teams) => {
            res.send(teams);
        }).catch(next);
    }

    res.format({
        'text/html': html,
        'application/json': json,
        'default': html
    });
});

let port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port}...`));

