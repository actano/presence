Promise = require 'bluebird'
moment = require 'moment'
getAbsence = require './getAbsence'

class Summary
    constructor: (@avail, @total) ->
        @percentage = 100 * @avail / @total

module.exports = Promise.coroutine (queryDate) ->
    isoDate = 'YYYY-MM-DD'

    teams = yield getAbsence queryDate
    resultDate = teams.date

    for team in teams
        team.head = if team.sprint.scrum then 'S' else 'W'
        team.head += team.sprint.count + 1

        sprintDays = Object.keys(team.queryDates).length
        sprintMembers = Object.keys(team.members).length
        sprintMemberDays = sprintDays * sprintMembers
        sprintMemberAvailabilities = Number(sprintMemberDays)

        for name, member of team.members
            for date in team.queryDates
                absence = member.getAbsence date
                status = absence?.status
                if status?
                    if (status == 'absent' || status == 'public-holiday')
                        sprintMemberAvailabilities--

        team.summary = new Summary sprintMemberAvailabilities, sprintMemberDays

    data =
        today: queryDate
        moment: moment
        date: resultDate
        teams: teams
        isoDate: isoDate
