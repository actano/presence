import bunyan from 'bunyan'
import express from 'express'
import { LocalDate } from 'js-joda'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import socketio from 'socket.io'
import config from './lib/config'
import presence from './lib/presence'
import Page from './lib/views'

const logger = bunyan({ name: 'index' })

const app = express()

app.locals.compileDebug = false

app.use(express.static('build'))

function getDate(dateParam) {
  let date
  if (dateParam) {
    try {
      date = LocalDate.parse(dateParam)
    } catch (e) {
      date = null
    }
  }
  if (!date) date = LocalDate.now()
  return date
}

app.get('/', (req, res, next) => {
  function html() {
    const framed = !!req.query.framed

    const props = {
      framed,
    }

    const pageElement = React.createElement(Page, props)
    res.send(`<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(pageElement)}`)
  }

  function json() {
    const date = getDate(req.query.date)
    const _config = config(date)
    presence(date).then((teams) => {
      res.send({
        teams,
        gravatarPrefix: _config.gravatarPrefix,
        emailSuffix: _config.emailSuffix,
      })
    }).catch(next)
  }

  res.format({
    'text/html': html,
    'application/json': json,
    default: html,
  })
})

const port = process.env.PORT || 3000

const server = app.listen(port, () => logger.info('Listening on port %s...', port))
const io = socketio(server, { serveClient: false, path: '/rt' })
io.on('connection', (client) => {
  client.on('date', (date) => {
    const _date = getDate(date)
    const _config = config(_date)
    presence(_date).then((teams) => {
      client.emit('teams', {
        date: _date.toString(),
        teams,
        gravatarPrefix: _config.gravatarPrefix,
        emailSuffix: _config.emailSuffix,
      })
    })
  })
})

// dumb pushing out of update events every 5 minutes
setInterval(() => {
  io.emit('update')
}, 5 * 60 * 1000)

