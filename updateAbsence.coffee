request = require 'request'
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
Promise.promisifyAll request
Promise.promisifyAll fs

# load team meta data
teams = require './teams'

EMAIL_SUFFIX = '@company.com'
GRAVATAR_PREFIX = 'https://www.gravatar.com/avatar/'
GRAVATAR_SUFFIX = '?s=50'

getGravatarUrlFromName = (name) ->
    name_md5 = md5 urlify(name.toLowerCase()) + EMAIL_SUFFIX
    "#{GRAVATAR_PREFIX}#{name_md5}#{GRAVATAR_SUFFIX}"

getIcsFilePath = (name, folder = 'cache') ->
    path.join(__dirname, folder, "#{name}.ics")

module.exports = Promise.coroutine (date) ->
    date = moment() if not moment(date).isValid()
    userDate = moment(date)

    # skip weekends
    while userDate.day() is 0 or userDate.day() is 6
        userDate.add(1, 'days')

    for team in teams

        result =
            name: team.name
            members: {}
            date: userDate.format 'YYYY-MM-DD'
            sprint: null
            queryDates: [userDate]
            status: null

        # initalize sprint information
        if team.sprint
            sprintStartDate = moment team.sprint.startDate
            weeksSinceSprintStart = userDate.diff(sprintStartDate, 'weeks')
            if weeksSinceSprintStart > 0
                sprintsSinceFirstStart = Math.floor weeksSinceSprintStart / team.sprint.durationWeeks
                currentSprintStartDate = sprintStartDate.add(sprintsSinceFirstStart * team.sprint.durationWeeks, 'weeks')
                currentSprintEndDate = moment(currentSprintStartDate).add(team.sprint.durationWeeks, 'weeks').subtract(1, 'days')
                result.sprint =
                    count: sprintsSinceFirstStart
                    start: currentSprintStartDate
                    end: currentSprintEndDate
                    scrum: team.sprint.scrum


                result.queryDates = []
                queryDate = moment(result.sprint.start)
                while not queryDate.isAfter(result.sprint.end)
                    result.queryDates.push(moment(queryDate)) unless queryDate.day() is 0 or queryDate.day() is 6
                    queryDate.add(1, 'days')

        # init team-members with gravatar urls
        for member in team.members
            result.members[member] = {
                name: member
                image_url: getGravatarUrlFromName member
                absences: {}
            }

        [response] = yield request.getAsync team.calendar

        teamCalendarData = null

        if response.statusCode >= 400

            result.status = "#{response.statusCode} - #{response.statusMessage}"

            fs.stat getIcsFilePath(result.name), (err, stats) ->
                if(!err)
                    result.cacheTimestamp = stats.mtime

            # read ics from file for recovery
            teamCalendarData = fs.readFileSync getIcsFilePath(result.name), {encoding: 'utf-8'}

        else

            result.status = "#{response.statusCode} - #{response.statusMessage}"

            fs.stat getIcsFilePath(result.name), (err, stats) ->
                if(!err)
                    result.cacheTimestamp = stats.mtime


            teamCalendarData = response.body

            # write ics to file for recovery
            yield fs.writeFileAsync getIcsFilePath(result.name), teamCalendarData
            console.info "#{result.name}.ics is saved!"

        teamCalendar = new ICAL.Component ICAL.parse(teamCalendarData)[1]

        holidayCalendarData = fs.readFileSync getIcsFilePath('public-holidays_de', 'calendars'), {encoding: 'utf-8'}
        holidayCalendar = new ICAL.Component ICAL.parse(holidayCalendarData)[1]

        calendars = [
            {
                calendar: teamCalendar,
                type: 'personal'
            }
            {
                calendar: holidayCalendar,
                type: 'public-holiday'
            }
        ]

        #iterate over the calendars
        for calendar in calendars

            #iterate over the dates (in the sprint or today)
            for queryDate in result.queryDates

                # each logical item in the confluence calendar
                # is a 'vevent'; lookup all events of that type
                for event in calendar.calendar.getAllSubcomponents 'vevent'
                    # parse iCal event
                    icalEvent = new ICAL.Event event

                    # init to defaults
                    status = 'absent'
                    isAbsent = false

                    # switch to away (aka. home-office or business travel)
                    icalEvent.component.jCal[1].map ([name, meta, type, value]) ->
                        if name is 'x-confluence-subcalendar-type' and value is 'travel'
                            status = 'away'

                    # normalize name ('Who and Description are separated by :')
                    name = icalEvent.summary.split(':')[0]

                    # map iCal dates to native dates
                    start = moment icalEvent.startDate?.toJSDate()
                    end = moment icalEvent.endDate?.toJSDate()

                    # handle recurring absences
                    if icalEvent.isRecurring() and
                            (start.isBefore(queryDate, 'day') or start.isSame(queryDate, 'day')) and
                            ((icalEvent.getRecurrenceTypes()?.WEEKLY and start.day() is queryDate.day()) or
                            (icalEvent.getRecurrenceTypes()?.YEARLY and start.format('MM-DD') is queryDate.format('MM-DD'))
                            )


                        isAbsent = true

                        # hand parse the exceptions and recurrence end date (until)
                        # see https://tools.ietf.org/html/rfc5545#section-3.8.5
                        icalEvent.component.jCal[1].map ([name, meta, type, value]) ->
                            if name is 'exdate' and moment(value).isSame queryDate, 'day'
                                isAbsent = false

                            if name is 'rrule'
                                untilDateString = /UNTIL=(.*);/.exec(value)?[1]
                                if untilDateString and moment(untilDateString).isBefore queryDate
                                    isAbsent = false

                    # if start is queryDate and duration less then seven hours, add the person to partial-absence list
                    else if start.isSame(queryDate, 'day') and end.diff(start) < (7 * 60 * 60 * 1000)
                        isAbsent = true
                        status = 'awayPartial'

                    # if both start and end are between yesterday and tomorrow, add the person to absence list
                    else if start.isBefore(moment(queryDate).add(1, 'days').subtract(1, 'minutes')) and end.isAfter(queryDate)
                        isAbsent = true

                    if isAbsent
                        if calendar.type is 'personal'
                            result.members[name]?.absences[queryDate.format 'YYYY-MM-DD'] =
                                status: status
                                description: icalEvent.description
                        else
                            for key, value of result.members
                                value.absences[queryDate.format 'YYYY-MM-DD'] =
                                    status: calendar.type
                                    description: name


        #console.log Object.keys(result.members).length
        result

