import express from 'express'
import { LocalDate } from 'js-joda'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import socketio from 'socket.io'
import config from './config'
import presence from './presence'
import Page from './page'
import _debug from './debug'

const debug = _debug.extend('server')
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
  const withError = fn => () => Promise.resolve(fn()).catch(next)

  const html = withError(() => {
    const framed = !!req.query.framed

    const props = {
      framed,
    }

    const pageElement = React.createElement(Page, props)
    res.send(`<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(pageElement)}`)
  })

  const json = withError(async () => {
    const date = getDate(req.query.date)
    debug('Generating presence for %s')
    const _config = await config(date.toString())
    const teams = await presence(date)
    debug('Sending presence for %s')
    res.send({
      teams,
      gravatarPrefix: _config.gravatarPrefix,
      emailSuffix: _config.emailSuffix,
    })
  })

  res.format({
    'text/html': html,
    'application/json': json,
    default: html,
  })
})

const withWarning = fn => (...args) => Promise.resolve(fn(...args)).catch(err => console.error(err))

const port = Number(process.env.PORT || 80)

const server = app.listen(port, () => console.log('Listening on port %s...', port))
const io = socketio(server, { serveClient: false, path: '/rt' })
io.on('connection', (client) => {
  client.on('date', withWarning(async (date) => {
    debug('client requesting update')
    const _date = getDate(date)
    const { gravatarPrefix, emailSuffix } = await config(_date.toString())
    const teams = await presence(_date)
    debug('sending update to client')
    client.emit('teams', {
      date: _date.toString(),
      teams,
      gravatarPrefix,
      emailSuffix,
    })
  }))
})

// dumb pushing out of update events every 5 minutes
setInterval(() => {
  io.emit('update')
}, 5 * 60 * 1000)

