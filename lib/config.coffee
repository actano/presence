module.exports = (date) ->
    isoDate = date.format 'YYYY-MM-DD'
    fs = require 'fs'
    yaml = require 'js-yaml'
    url = require 'url'

    config = yaml.safeLoad fs.readFileSync 'teams.yml'
    removePrefix = config.removePrefix || ':'

    applyDefaults = (defaults, target) ->
        for k, defaultValue of defaults
            current = target[k]
            unless current?
                target[k] = defaultValue
            else if Array.isArray(current) and Array.isArray(defaultValue)
                unless current.length
                    target[k] = current
                    continue
                removes = {}
                for i in [current.length-1..0]
                    item = current[i]
                    if removePrefix is item.substring 0, removePrefix.length
                        item = item.substring removePrefix.length
                        removes[item] = true
                        current.splice i, 1
                defaultValue = defaultValue.filter (item) -> !removes[item]
                target[k] = defaultValue.concat current
            else if (typeof current is 'object') and (typeof defaultValue is 'object')
                applyDefaults defaultValue, current

    teamMap = {}
    sortedTeams = []
    for from, teams of config.teams
        continue if from > isoDate
        sortedTeams.push {from, teams}
    sortedTeams.sort (a, b) ->
        return -1 if a.from < b.from
        return 1 if a.from > b.from
        return 0

    for sorted in sortedTeams
        from = sorted.from
        teams = sorted.teams

        for team in teams
            defaults = teamMap[team.name] || config.teamDefaults
            applyDefaults defaults, team
            team.sprint.startDate = from unless team.sprint.startDate?
            team.calendar = url.resolve config.calendarPrefix, team.calendar
            teamMap[team.name] = team

    config.teams = []
    for name, team of teamMap
        continue if team.sprint?.startDate > isoDate
        continue if team.members.length is 0
        team.members.sort (a,b) -> a.localeCompare b
        config.teams.push team

    config.teams.sort (a, b) ->
        return -1 if a.weight < b.weight
        return 1 if a.weight > b.weight
        return a.name.localeCompare b.name

    config