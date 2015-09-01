path = require 'path'

Promise = require 'bluebird'
Promise.longStackTraces()

express = require 'express'
stylus = require 'stylus'
autoprefixer = require 'express-autoprefixer'

app = express()

viewsDir  = path.join __dirname, 'views'
stylesDir = path.join __dirname, 'styles'
publicDir = path.join __dirname, 'public'

app.set 'views', viewsDir
app.set 'view engine', 'jade'
server = require './server'

# prevents -> https://github.com/alubbe/memoryleak
if process.env.NODE_ENV and process.env.NODE_ENV isnt 'development'
    app.locals.compileDebug = false

app.use stylus.middleware src: stylesDir, dest: publicDir
app.use autoprefixer browsers: 'last 2 versions', cascade: false


# respond with rendered html
app.get '/', Promise.coroutine (req, res) ->
    data = yield server req.query?.date
    res.render 'index', data

app.use express.static publicDir

port = process.env.PORT or 3000

app.listen port, ->
    console.log "Listening on port #{port}..."

