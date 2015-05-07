Promise = require 'bluebird'
request = require "request"
express = require 'express'
path = require 'path'
stylus = require 'stylus'
autoprefixer = require 'autoprefixer-stylus'

ICAL = require 'ical.js'
moment = require 'moment'

Promise.longStackTraces()
Promise.promisifyAll request

teams = require './teams'
app = express()

app.set 'views', path.join(__dirname, 'views')
app.set 'view engine', 'jade'

src = path.join __dirname, 'styles'

dest = path.join __dirname, 'public'

app.use stylus.middleware {src, dest}

app.get '/', Promise.coroutine (req, res) ->
    results = []

    today = new moment({hour: 0, minute: 1})
    tomorrow = today.add(1, 'days').subtract(2, 'minutes')


    for team in teams
        [response] = yield request.getAsync team.calender

        result =
            members: team.members
            name: team.name
            absentees: []

        jCalData = ICAL.parse response.body
        comp = new (ICAL.Component)(jCalData[1])

        for event in comp.getAllSubcomponents 'vevent'

            icalEvent = new (ICAL.Event)(event)
            start = moment icalEvent.startDate?.toJSDate()
            end = moment icalEvent.endDate?.toJSDate()

            if start.isBefore(tomorrow) and end.isAfter(today)
                result.absentees.push icalEvent.summary

            else if icalEvent.isRecurring() and icalEvent.getRecurrenceTypes()?.WEEKLY and start.day() is today.day()
#                if icalEvent.summary is "Andreas Lubbe"
#                    console.log icalEvent.iterator()
                result.absentees.push icalEvent.summary

        results.push result

    res.render "index",
        results: results

app.use express.static(__dirname + '/public')

port = process.env.PORT or 3000
app.listen port, ->
    console.log "Listening on port #{port}"
