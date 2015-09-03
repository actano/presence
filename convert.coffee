fs = require 'fs'
yaml = require 'js-yaml'
config = yaml.safeLoad fs.readFileSync 'teams.yml'

removeDefaults = (target, defaults) ->
    result = true
    for k, v of target
        remove = false

        defaultValue = defaults[k]
        if defaultValue?
            if (typeof v is 'object') and (typeof defaultValue is 'object')
                remove = removeDefaults v, defaultValue
            else
                remove = v is defaultValue
        if remove
            delete target[k]
        else
            result = false

    return result

teams = require './teams'
for team in teams
    if config.calendarPrefix is team.calendar?.substring 0, config.calendarPrefix.length
        team.calendar = team.calendar.substring config.calendarPrefix.length

    removeDefaults team, config.teamDefaults

fs.writeFileSync 'teams1.yml', yaml.safeDump teams: '2015-01-01': teams
