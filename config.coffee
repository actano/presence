module.exports = (date) ->
    isoDate = date.format 'YYYY-MM-DD'
    fs = require 'fs'
    yaml = require 'js-yaml'
    url = require 'url'

    applyDefaults = (defaults, target) ->
        for k, defaultValue of defaults
            current = target[k]
            unless current?
                target[k] = defaultValue
            else if Array.isArray(current) and Array.isArray(defaultValue)
                target[k] = defaultValue.concat current if current.length > 0
            else if (typeof current is 'object') and (typeof defaultValue is 'object')
                applyDefaults defaultValue, current

    config = yaml.safeLoad fs.readFileSync 'teams.yml'
    teamMap = {}
    for from, teams of config.teams
        continue if from > isoDate

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