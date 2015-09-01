Promise = require 'bluebird'
seedrandom = require 'seedrandom'
getAbsence = require './getAbsence'

module.exports = Promise.coroutine (date) ->
        isoDate = 'YYYY-MM-DD'
        deDate = 'DD.MM.YYYY'
        rng = null

        teams = yield getAbsence date

        for team in teams
            team.cssClass = ['team']
            team.cssClass.push 'hasSprint' if team.sprint?
            team.cssClass.push 'scrum' if team.sprint?.scrum

            if team.sprint
                team.head = if team.sprint.scrum then 'Sprint' else 'Week'
                team.head += " #{team.sprint.count + 1}"

                sprintDays = Object.keys(team.queryDates).length
                sprintMembers = Object.keys(team.members).length
                sprintMemberDays = sprintDays * sprintMembers
                sprintMemberAvailabilities = Number(sprintMemberDays)

                avail = []

                for name, member of team.members
                    todayAbsence = member.absences[team.date] ? 'todayAbsence' : null
                    member.cssClass = [todayAbsence]
                    member.dates = []
                    for date in team.queryDates
                        status = null
                        description = null
                        absence = member.absences[date.format(isoDate)]
                        preWeekend = date.day() == 5 ? 'preWeekend' : null
                        postWeekend = date.day() == 1 ? 'postWeekend' : null

                        memberDate =
                            cssClass: [preWeekend, postWeekend]
                            date: date
                            description: description

                        if absence?
                            status = absence.status
                            if (status == 'absent' || status == 'public-holiday')
                                sprintMemberAvailabilities--
                            memberDate.description = absence.description
                            memberDate.cssClass.push status

                        if date.format(isoDate) == team.date
                            memberDate.content = member.name
                            avail.push member unless absence?
                        else if status == 'public-holiday'
                            memberDate.content = description
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
                    status = null
                    description = null
                    if member.absences[team.date]
                        status = member.absences[team.date].status
                        description = member.absences[team.date].description
                    member.cssClass = [status]
                    member.title = description

        data =
            teams: teams
            isoDate: isoDate
            deDate: deDate