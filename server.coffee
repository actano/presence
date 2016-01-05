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
    rng = seedrandom resultDate

    for team in teams
        if team.status
            team.statusDescription = "Calendar failed: \"#{team.status}\", loading data from cache (#{moment(team.cacheTimestamp).format('L LT')})."

        if team.sprint
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
                    memberDate = cssClass: [], date: date
                    absence = member.absences[date.format(isoDate)]
                    memberDate.cssClass.push 'preWeekend' if date.day() == 5
                    memberDate.cssClass.push 'postWeekend' if date.day() == 1

                    status = absence?.status
                    if status?
                        if (status == 'absent' || status == 'public-holiday')
                            sprintMemberAvailabilities--
                        memberDate.description = absence.description
                        memberDate.cssClass.push status

                    if date.format(isoDate) == resultDate
                        memberDate.content = member.name
                        member.cssClass.push status if status?
                        avail.push member unless absence?
                    else if status == 'public-holiday'
                        memberDate.content = absence.description
                    else
                        memberDate.content = date.format('dd., DD.M.')
                    member.dates.push memberDate

            if avail.length and team.sprint.scrum
                selectedMember = avail[Math.floor(rng() * avail.length)]
                selectedMember.cssClass.push 'selected'
            team.summary = new Summary sprintMemberAvailabilities, sprintMemberDays

        else
            for member in team.members
                member.cssClass = []
                absence = member.absences[resultDate]
                if absence?
                    member.cssClass.push absence.status
                    member.title = absence.description

    data =
        date: resultDate
        teams: teams
        isoDate: isoDate
        isToday: (moment) ->
            moment.isSame(queryDate, 'day')