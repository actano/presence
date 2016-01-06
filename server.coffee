Promise = require 'bluebird'
seedrandom = require 'seedrandom'
moment = require 'moment'
getAbsence = require './getAbsence'

class Summary
    constructor: (@avail, @total) ->
        @percentage = 100 * @avail / @total

module.exports = Promise.coroutine (queryDate) ->
    isoDate = 'YYYY-MM-DD'

    teams = yield getAbsence queryDate
    resultDate = teams.date
    rng = seedrandom resultDate.format isoDate

    for team in teams
        team.head = if team.sprint.scrum then 'S' else 'W'
        team.head += team.sprint.count + 1

        sprintDays = Object.keys(team.queryDates).length
        sprintMembers = Object.keys(team.members).length
        sprintMemberDays = sprintDays * sprintMembers
        sprintMemberAvailabilities = Number(sprintMemberDays)

        avail = []

        for name, member of team.members
            member.cssClass = []
            member.dates = []
            for date in team.queryDates
                memberDate =
                    status: null
                    date: date
                    description: null
                    content: null

                absence = member.getAbsence date
                status = absence?.status
                memberDate.status = status
                if status?
                    if (status == 'absent' || status == 'public-holiday')
                        sprintMemberAvailabilities--
                    memberDate.description = absence.description

                if date.isSame resultDate, 'day'
                    member.cssClass.push status if status?
                    avail.push member unless absence?
                member.dates.push memberDate

        if avail.length and team.sprint.scrum
            selectedMember = avail[Math.floor(rng() * avail.length)]
            selectedMember.selected = true
        team.summary = new Summary sprintMemberAvailabilities, sprintMemberDays

    data =
        moment: moment
        date: resultDate
        teams: teams
        isoDate: isoDate
        isToday: (moment) ->
            moment.isSame(queryDate, 'day')