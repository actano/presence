moment = require 'moment'
Member = require './member'

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
    constructor: (teamConfig, date, @calendars...) ->
        @name = teamConfig.name
        @sprint = initSprint teamConfig.sprint, date
        @status = null
        @members = (new Member @calendars, member for member in teamConfig.members)

    selectedMember: (date) ->
        if @sprint.scrum
            avail = []

            for member in @members
                absence = member.absences(date).next().value
                continue if absence?.date.isSame date, 'day'
                avail.push member

            if avail.length
                seedrandom = require 'seedrandom'
                rng = seedrandom date.format 'YYYY-MM-DD'
                return avail[Math.floor(rng() * avail.length)]

    sprintSummary: ->
        sprintDays = @sprint.datesCount()
        sprintMembers = @members.length
        sprintMemberDays = sprintDays * sprintMembers
        sprintMemberAvailabilities = Number(sprintMemberDays)

        for member in @members
            iter = @sprint.dates()
            until (item = iter.next()).done
                date = item.value
                absenceIterator = member.absences date
                until (item = absenceIterator.next()).done
                    absence = item.value
                    break unless (absence.date.isSame date, 'day')
                    status = absence.status
                    if (status == 'absent' || status == 'public-holiday')
                        sprintMemberAvailabilities--
                        break

        new Summary sprintMemberAvailabilities, sprintMemberDays

module.exports = Team