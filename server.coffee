Promise = require 'bluebird'
seedrandom = require 'seedrandom'
getAbsence = require './getAbsence'

module.exports = Promise.coroutine (date) ->
    isoDate = 'YYYY-MM-DD'
    deDate = 'DD.MM.YYYY'
    rng = null

    teams = yield getAbsence date

    for team in teams
        if team.sprint
            team.head = if team.sprint.scrum then 'Sprint' else 'Week'
            team.head += " #{team.sprint.count + 1}"

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

                    if date.format(isoDate) == team.date
                        memberDate.content = member.name
                        avail.push member unless absence?
                    else if status == 'public-holiday'
                        memberDate.content = absence.description
                    else
                        memberDate.content = date.format('dd., DD.M.')
                    member.dates.push memberDate

            if avail.length and team.sprint.scrum
                unless rng?
                    rng = seedrandom team.date
                selectedMember = avail[Math.floor(rng() * avail.length)]
                selectedMember.cssClass.push 'selected'
            team.summary =
                percentage: (sprintMemberAvailabilities / (sprintMemberDays / 100))
                memberAvailabilities: sprintMemberAvailabilities
                memberDays: sprintMemberDays

        else
            for member in team.members
                member.cssClass = []
                absence = member.absences[team.date]
                if absence?
                    member.cssClass.push absence.status
                    member.title = absence.description

    data =
        teams: teams
        isoDate: isoDate
        deDate: deDate