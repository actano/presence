express = require 'express'
path = require 'path'
stylus = require 'stylus'
autoprefixer = require 'autoprefixer-stylus'
Promise = require 'bluebird'
Promise.longStackTraces()

getAbsence = require './getAbsence'

app = express()

viewsDir  = path.join __dirname, 'views'
stylesDir = path.join __dirname, 'styles'
publicDir = path.join __dirname, 'public'

app.set 'views', viewsDir
app.set 'view engine', 'jade'

app.use stylus.middleware src: stylesDir, dest: publicDir

# respond with rendered html
app.get '/', Promise.coroutine (req, res) ->
    res.render "index",
        results: yield getAbsence(req.query?.date)

# respond with raw absence data
app.get '/json', Promise.coroutine (req, res) ->
    res.json yield getAbsence(req.query?.date)

app.use express.static publicDir

port = process.env.PORT or 3000

app.listen port, ->
    console.log "Listening on port #{port}..."
