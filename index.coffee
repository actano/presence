request = require 'request'
express = require 'express'
path = require 'path'
stylus = require 'stylus'
autoprefixer = require 'autoprefixer-stylus'

ICAL = require 'ical.js'
moment = require 'moment'

Promise = require 'bluebird'
Promise.longStackTraces()
Promise.promisifyAll request

# load team meta data from json
teams = require './teams'

# will contain absence data
# after it has been populated
absence = []

app = express()

app.set 'views', path.join __dirname, 'views'
app.set 'view engine', 'jade'

# assets
src  = path.join __dirname, 'styles'
dest = path.join __dirname, 'public'

# register stylus middleware
app.use stylus.middleware {src, dest}

# respond with rendered html
app.get '/', (req, res) ->
    res.render "index",
        results: absence

# respond with raw absence data
app.get '/json', (req, res) ->
    res.json absence

app.use express.static __dirname + '/public'

updateAbsence = Promise.coroutine (cb) ->
    results = []

    today = new moment hour: 0, minute: 1
    tomorrow = today.add(1, 'days').subtract 2, 'minutes'

    for team in teams
        result =
            members: team.members
            name: team.name
            absentees: []

        [response] = yield request.getAsync team.calender

        jCalData = ICAL.parse response.body
        comp = new ICAL.Component jCalData[1]

        # each logical item in the confluence calendar
        # is a 'vevent'; lookup all events of that type
        for event in comp.getAllSubcomponents 'vevent'
            # parse iCal event
            icalEvent = new ICAL.Event event

            # map iCal dates to native dates
            start = moment icalEvent.startDate?.toJSDate()
            end = moment icalEvent.endDate?.toJSDate()

            # if both start and end are between yesterday
            # and tomorrow, add the person to absence list
            if start.isBefore(tomorrow) and end.isAfter(today)
                result.absentees.push icalEvent.summary

            # handle recurring absence for part-time employees
            else if icalEvent.isRecurring() and
                    icalEvent.getRecurrenceTypes()?.WEEKLY and
                    start.day() is today.day()
                # TODO RX-2895 handle exceptions
                # if icalEvent.summary is "Andreas Lubbe"
                #   console.log icalEvent.iterator()
                result.absentees.push icalEvent.summary

        # push team onto absence stack
        results.push result

    absence = results

    do cb if cb?

console.log 'Loading data..'

# obtain initial payload
updateAbsence ->
    port = process.env.PORT or 3000

    # start server and listen
    app.listen port, ->
        console.log "Listening on port #{port}.."

    # main loop, interval 10 seconds
    do main = -> setTimeout (-> updateAbsence main), 10 * 1000
