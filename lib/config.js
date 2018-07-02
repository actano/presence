import fs from 'fs'
import yaml from 'js-yaml'
import url from 'url'

function compareDateBreaks(a, b) {
  if (a.from < b.from) return -1
  if (a.from > b.from) return 1
  return 0
}

function compareTeams(a, b) {
  if (a.weight < b.weight) return -1
  if (a.weight > b.weight) return 1
  return a.name.localeCompare(b.name)
}

export default function config(date) {
  const isoDate = date.toString()

  const _config = yaml.safeLoad(fs.readFileSync('teams.yml'))
  const removePrefix = _config.removePrefix || ':'

  const mergeValue = (defaultValue, currentTarget, merge) => {
    if (currentTarget == null) {
      return defaultValue
    }

    if (Array.isArray(currentTarget) && Array.isArray(defaultValue)) {
      if (!currentTarget.length) {
        return currentTarget
      }
      const removes = {}
      const indices = []
      let index = 0
      for (const item of currentTarget) {
        if (removePrefix === item.substring(0, removePrefix.length)) {
          removes[item.substring(removePrefix.length)] = true
          indices.unshift(index)
        }
        index += 1
      }
      for (const i of indices) currentTarget.splice(i, 1)
      return defaultValue.filter(item => !removes[item]).concat(currentTarget)
    }

    if ((typeof currentTarget === 'object') && (typeof defaultValue === 'object')) {
      merge(defaultValue, currentTarget)
    }
    return currentTarget
  }

  const mergeDefaults = (defaults, target) => {
    const result = target

    for (const k of Object.keys(defaults)) {
      result[k] = mergeValue(defaults[k], result[k], mergeDefaults)
    }
  }

  const configTeam = (team) => {
    const { teamDefaults, calendarPrefix } = _config
    mergeDefaults(teamDefaults, team)
    if ((team.sprint != null) && team.sprint.startDate > isoDate) return undefined
    if (team.members.length === 0) return undefined
    team.calendar = url.resolve(calendarPrefix, team.calendar)
    team.members.sort((a, b) => a.localeCompare(b))
    return team
  }

  const collectTeams = () => {
    const teamMap = {}
    const sortedTeams = []
    const teamsByDate = _config.teams

    for (const from of Object.keys(teamsByDate)) {
      const teams = teamsByDate[from]
      if (from <= isoDate) {
        sortedTeams.push({ from, teams })
      }
    }
    sortedTeams.sort(compareDateBreaks)

    for (const sorted of sortedTeams) {
      for (const team of sorted.teams) {
        const defaults = teamMap[team.name]
        if (defaults != null) {
          mergeDefaults(defaults, team)
        }
        if (team.sprint == null) {
          team.sprint = {}
        }
        if (team.sprint.startDate == null) {
          team.sprint.startDate = sorted.from
        }
        teamMap[team.name] = team
      }
    }

    const result = []
    for (const name of Object.keys(teamMap)) {
      const team = configTeam(teamMap[name])
      if (team) {
        result.push(team)
      }
    }
    result.sort(compareTeams)
    return result
  }

  _config.teams = collectTeams()
  return _config
}
