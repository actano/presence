fs = require 'fs'
path = require 'path'
moment = require 'moment'

Promise = require 'bluebird'
Promise.promisifyAll fs

icsFromURL = require './ics-from-url'

Calendar = require './calendar'
Team = require './team'

# load team meta data
module.exports = Promise.coroutine (userDate) ->
    config = require('./config') userDate

    holidayCalendarData = yield fs.readFileAsync path.join(path.dirname(__dirname), 'calendars', 'public-holidays_de.ics'), 'utf-8'
    holidayCalendar = new Calendar holidayCalendarData
    holidayCalendar.holidays = true

    for team in config.teams
        teamCalendarData = yield icsFromURL team.calendar

        result = new Team team, userDate, holidayCalendar, new Calendar teamCalendarData.content
        result.cacheTimestamp = moment teamCalendarData.mtime

        for name, member of result.members
            member.createAbsences()
        result
