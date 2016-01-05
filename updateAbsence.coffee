fs = require 'fs'
path = require 'path'
ICAL = require 'ical.js'
moment = require 'moment'
md5 = require 'MD5'
urlify = require('urlify').create
    addEToUmlauts: true
    szToSs: true
    spaces: "."
    nonPrintable: "_"
    trim: true

Promise = require 'bluebird'
Promise.promisifyAll fs

icsFromURL = require './lib/ics-from-url'

class Sprint
    constructor: (@count, @start, @end, @scrum) ->

class Team
    constructor: (@name) ->
        @members = {}
        @sprint = null
        @queryDates = []
        @status = null

class Member
    constructor: (config, @name) ->
        getGravatarUrlFromName = (name) ->
            name_md5 = md5 urlify(name.toLowerCase()) + config.emailSuffix
            "#{config.gravatarPrefix}#{name_md5}"

        @image_url = getGravatarUrlFromName @name
        @absences = {}


# load team meta data
module.exports = Promise.coroutine (userDate) ->
    config = require('./config') userDate

    # skip weekends
    while userDate.day() is 0 or userDate.day() is 6
        userDate.add(1, 'days')

    teams = for team in config.teams

        result = new Team(team.name)

        # initalize sprint information
        if team.sprint
            sprintStartDate = moment team.sprint.startDate
            weeksSinceSprintStart = userDate.diff(sprintStartDate, 'weeks')
            if weeksSinceSprintStart >= 0 and (userDate.isAfter(sprintStartDate, 'day') or userDate.isSame(sprintStartDate, 'day'))
                sprintsSinceFirstStart = Math.floor weeksSinceSprintStart / team.sprint.durationWeeks
                currentSprintStartDate = sprintStartDate.add(sprintsSinceFirstStart * team.sprint.durationWeeks, 'weeks')
                currentSprintEndDate = moment(currentSprintStartDate).add(team.sprint.durationWeeks, 'weeks').subtract(1, 'days')
                result.sprint = new Sprint sprintsSinceFirstStart, currentSprintStartDate, currentSprintEndDate, team.sprint.scrum

                result.queryDates = []
                queryDate = moment(result.sprint.start)
                while not queryDate.isAfter(result.sprint.end)
                    result.queryDates.push(moment(queryDate)) unless queryDate.day() is 0 or queryDate.day() is 6
                    queryDate.add(1, 'days')

        # init team-members with gravatar urls
        for member in team.members
            result.members[member] = new Member config, member

        teamCalendarData = yield icsFromURL team.calendar
        result.cacheTimestamp = teamCalendarData.mtime

        teamCalendar = new ICAL.Component ICAL.parse teamCalendarData.content

        holidayCalendarData = yield fs.readFileAsync path.join(__dirname, 'calendars', 'public-holidays_de.ics'), 'utf-8'
        holidayCalendar = new ICAL.Component ICAL.parse holidayCalendarData

        updateCalendar = (calendar, calendarType, queryDate) ->
            # each logical item in the confluence calendar
            # is a 'vevent'; lookup all events of that type
            for event in calendar.getAllSubcomponents 'vevent'
                # parse iCal event
                icalEvent = new ICAL.Event event
                updateEvent icalEvent, calendarType, queryDate

        updateEvent = (icalEvent, calendarType, queryDate) ->
            processAbsence = (status = 'absent') ->
                # normalize name ('Who and Description are separated by :')
                name = icalEvent.summary.split(':')[0]

                if calendarType is 'personal'
                    # switch to away (aka. home-office or business travel)
                    status = 'away' if status is 'absent' and icalEvent.component.jCal[1].some ([name, meta, type, value]) ->
                        name is 'x-confluence-subcalendar-type' and value is 'travel'

                    result.members[name]?.absences[queryDate.format 'YYYY-MM-DD'] =
                        status: status
                        description: icalEvent.description
                else
                    for key, value of result.members
                        value.absences[queryDate.format 'YYYY-MM-DD'] =
                            status: calendarType
                            description: name


            # map iCal dates to native dates
            start = moment icalEvent.startDate?.toJSDate()
            end = moment icalEvent.endDate?.toJSDate()

            # handle recurring absences
            if icalEvent.isRecurring() and
                    (start.isBefore(queryDate, 'day') or start.isSame(queryDate, 'day')) and
                    ((icalEvent.getRecurrenceTypes()?.WEEKLY and start.day() is queryDate.day()) or
                    (icalEvent.getRecurrenceTypes()?.YEARLY and start.format('MM-DD') is queryDate.format('MM-DD'))
                    )


                # hand parse the exceptions and recurrence end date (until)
                # see https://tools.ietf.org/html/rfc5545#section-3.8.5
                return processAbsence() if icalEvent.component.jCal[1].every ([name, meta, type, value]) ->
                    return false if name is 'exdate' and moment(value).isSame queryDate, 'day'

                    if name is 'rrule'
                        untilDateString = value.until
                        return false if untilDateString and moment(untilDateString).isBefore queryDate

                    return true

            # if start is queryDate and duration less then seven hours, add the person to partial-absence list
            else if start.isSame(queryDate, 'day') and end.diff(start) < (7 * 60 * 60 * 1000)
                return processAbsence 'awayPartial'

            # if both start and end are between yesterday and tomorrow, add the person to absence list
            else if start.isBefore(moment(queryDate).add(1, 'days').subtract(1, 'minutes')) and end.isAfter(queryDate)
                return processAbsence()

        #iterate over the dates (in the sprint or today)
        for queryDate in result.queryDates
            updateCalendar teamCalendar, 'personal', queryDate
            updateCalendar holidayCalendar, 'public-holiday', queryDate

        result
    teams.date = userDate.format 'YYYY-MM-DD'
    teams
