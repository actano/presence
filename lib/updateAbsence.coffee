fs = require 'fs'
path = require 'path'
moment = require 'moment'

Promise = require 'bluebird'
Promise.promisifyAll fs

icsFromURL = require './ics-from-url'
isoDate = 'YYYY-MM-DD'

Calendar = require './calendar'

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

createAbsence = (event, day) ->
    if event.calendar.holidays
        return status: 'public-holiday', description: event.name()
    startDate = day.startDate()
    endDate = day.endDate()
    duration = endDate.diff startDate, 'minutes'
    status = if duration < 7 * 60 then 'awayPartial' else 'absent'
    # switch to away (aka. home-office or business travel)
    status = 'away' if status is 'absent' and event.isTravel()
    return status: status, description: event.description()

class Team
    constructor: (teamConfig, date, @calendars...) ->
        @name = teamConfig.name
        @sprint = initSprint teamConfig.sprint, date
        @status = null
        @members = {}
        for member in teamConfig.members
            @members[member] = new Member this, member

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
    constructor: (@team, @name) ->
        @absences = {}
        @selected = false

    events: ->
        for calendar in @team.calendars
            iter = calendar.events()
            until (item = iter.next()).done
                event = item.value
                if event.calendar.holidays or event.name() is @name
                    yield event

    _processInstance: (instance) ->
        dayIterator = instance.days @team.sprint.start
        until (item = dayIterator.next()).done
            day = item.value
            startDate = day.startDate()
            break if startDate.isAfter @team.sprint.end, 'days'

            absence = createAbsence instance.event, day
            key = startDate.format isoDate
            @absences[key] = absence

    _processEvent: (event) ->
        instanceIterator = event.instances @team.sprint.start
        until (item = instanceIterator.next()).done
            instance = item.value
            break if instance.startDate().isAfter @team.sprint.end, 'days'
            @_processInstance instance

    createAbsences: ->
        eventIterator = @events()
        until (item = eventIterator.next()).done
            event = item.value
            try
                @_processEvent event
            catch error
                console.warn 'Exception processing %s, skipping further processing: %s', event.name(), error


    getAbsence: (date) ->
        @absences[date.format isoDate]

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
