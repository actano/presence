path = require 'path'

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
app.get '/', (req, res, next) ->
    presence = require './lib/presence'
    config = require './lib/config'
    moment = require 'moment'
    if req.query?.date?
        date = moment req.query.date
        date = null unless date.isValid()
    date = moment() unless date?

    presence date, (err, teams) ->
        return next err if err?

        data =
            today: date
            teams: teams
            gravatarUrlFromName: config.gravatarUrlFromName

        res.render 'index', data

app.use express.static publicDir

port = process.env.PORT or 3000

app.listen port, ->
    console.log "Listening on port #{port}..."

