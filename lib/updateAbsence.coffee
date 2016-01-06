fs = require 'fs'
path = require 'path'
ICAL = require 'ical.js'
moment = require 'moment'

Promise = require 'bluebird'
Promise.promisifyAll fs

icsFromURL = require './ics-from-url'
isoDate = 'YYYY-MM-DD'

class Summary
    constructor: (@avail, @total) ->
        @percentage = 100 * @avail / @total

class Sprint
    constructor: (@count, @start, @end, @scrum) ->
    dates: ->
        date = moment @start
        while not date.isAfter @end
            yield moment date unless date.day() is 0 or date.day() is 6
            date.add 1, 'days'
    datesCount: ->
        result = 0
        iter = @dates()
        until iter.next().done
            result++
        result

initSprint = (sprintConfig, date) ->
    return unless sprintConfig?
    sprintStartDate = moment sprintConfig.startDate
    weeksSinceSprintStart = date.diff(sprintStartDate, 'weeks')
    if weeksSinceSprintStart >= 0 and (date.isAfter(sprintStartDate, 'day') or date.isSame(sprintStartDate, 'day'))
        sprintsSinceFirstStart = Math.floor weeksSinceSprintStart / sprintConfig.durationWeeks
        currentSprintStartDate = sprintStartDate.add(sprintsSinceFirstStart * sprintConfig.durationWeeks, 'weeks')
        currentSprintEndDate = moment(currentSprintStartDate).add(sprintConfig.durationWeeks, 'weeks').subtract(1, 'days')
        new Sprint sprintsSinceFirstStart, currentSprintStartDate, currentSprintEndDate, sprintConfig.scrum

class Team
    constructor: (teamConfig, date) ->
        @name = teamConfig.name
        @sprint = initSprint teamConfig.sprint, date
        @members = {}
        @status = null

    selectedMember: (date) ->
        if @sprint.scrum
            avail = []

            for name, member of @members
                absence = member.getAbsence date
                avail.push member unless absence?

            if avail.length
                seedrandom = require 'seedrandom'
                rng = seedrandom date.format isoDate
                return avail[Math.floor(rng() * avail.length)]

    sprintSummary: ->
        sprintDays = @sprint.datesCount()
        sprintMembers = Object.keys(@members).length
        sprintMemberDays = sprintDays * sprintMembers
        sprintMemberAvailabilities = Number(sprintMemberDays)

        for name, member of @members
            iter = @sprint.dates()
            until (date = iter.next()).done
                absence = member.getAbsence date.value
                status = absence?.status
                if status?
                    if (status == 'absent' || status == 'public-holiday')
                        sprintMemberAvailabilities--

        new Summary sprintMemberAvailabilities, sprintMemberDays


class Member
    constructor: (config, @name) ->
        @absences = {}
        @selected = false


    getAbsence: (date) ->
        @absences[date.format isoDate]

# load team meta data
module.exports = Promise.coroutine (userDate) ->
    config = require('./config') userDate

    for team in config.teams

        result = new Team team, userDate

        # init team-members with gravatar urls
        for member in team.members
            result.members[member] = new Member config, member

        teamCalendarData = yield icsFromURL team.calendar
        result.cacheTimestamp = moment teamCalendarData.mtime

        teamCalendar = new ICAL.Component ICAL.parse teamCalendarData.content

        holidayCalendarData = yield fs.readFileAsync path.join(path.dirname(__dirname), 'calendars', 'public-holidays_de.ics'), 'utf-8'
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
        iter = result.sprint.dates()
        until (date = iter.next()).done
            updateCalendar teamCalendar, 'personal', date.value
            updateCalendar holidayCalendar, 'public-holiday', date.value

        result