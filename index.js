import path from 'path';
import express from 'express';
import presence from './lib/presence'
import config from './lib/config'
import Helpers from './lib/jade-helpers'
import moment from 'moment'

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
    if ((req.query != null) && (req.query.date != null)) {
        var date = moment(req.query.date);
        if (!date.isValid()) { date = null; }
    }
    if (date == null) { var date = moment(); }

    return presence(date, function(err, teams) {
        if (err != null) { return next(err); }

        let data = new Helpers(date.locale('de'));
        data.teams = teams;
        data.gravatarUrlFromName = config.gravatarUrlFromName;
        if (!data.gravatarUrlFromName) {
            throw new Error();
        }

        return res.render('index', data);
    });
});

app.use(express.static(publicDir));

let port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port}...`));

