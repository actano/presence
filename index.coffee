path = require 'path'

Promise = require 'bluebird'
Promise.longStackTraces()

express = require 'express'

app = express()

viewsDir  = path.join __dirname, 'views'
stylesDir = path.join __dirname, 'styles'
publicDir = path.join __dirname, 'public'

app.set 'views', viewsDir
app.set 'view engine', 'jade'

app.locals.compileDebug = false

stylus = require 'stylus'
app.use stylus.middleware src: stylesDir, dest: publicDir

autoprefixer = require 'express-autoprefixer'
app.use autoprefixer browsers: 'last 2 versions', cascade: false

# respond with rendered html
app.get '/', Promise.coroutine (req, res) ->
    moment = require 'moment'
    getAbsence = require './getAbsence'
    if req.query?.date?
        date = moment req.query.date
        date = null unless date.isValid()
    date = moment() unless date?
    date.startOf 'day'

    teams = yield getAbsence date
    data =
        today: teams.date
        moment: moment
        date: teams.date
        teams: teams

    res.render 'index', data

app.use express.static publicDir

port = process.env.PORT or 3000

app.listen port, ->
    console.log "Listening on port #{port}..."

