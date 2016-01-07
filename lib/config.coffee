md5 = require 'MD5'
urlify = require('urlify').create
    addEToUmlauts: true
    szToSs: true
    spaces: "."
    nonPrintable: "_"
    trim: true

gravatarUrlFromName = null

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
            defaults = teamMap[team.name]
            applyDefaults defaults, team if defaults?
            team.sprint = {} unless team.sprint?
            team.sprint.startDate = from unless team.sprint.startDate?
            teamMap[team.name] = team

    config.teams = []
    for name, team of teamMap
        applyDefaults config.teamDefaults, team
        continue if team.sprint?.startDate > isoDate
        continue if team.members.length is 0
        team.calendar = url.resolve config.calendarPrefix, team.calendar
        team.members.sort (a,b) -> a.localeCompare b
        config.teams.push team

    config.teams.sort (a, b) ->
        return -1 if a.weight < b.weight
        return 1 if a.weight > b.weight
        return a.name.localeCompare b.name

    # set static function
    module.exports.gravatarUrlFromName = gravatarUrlFromName = (name) ->
        name_md5 = md5 urlify(name.toLowerCase()) + config.emailSuffix
        "#{config.gravatarPrefix}#{name_md5}"

    config

module.exports.gravatarUrlFromName = (name) ->
    unless gravatarUrlFromName?
        # load some default config to init fn
        moment = require 'moment'
        module.exports(moment())
    gravatarUrlFromName name

