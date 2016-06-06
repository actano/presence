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

  function applyDefaults(defaults, target) {
    const result = target
    for (const k in defaults) {
      if (!defaults.hasOwnProperty(k)) continue
      let defaultValue = defaults[k]
      const current = result[k]
      if (current == null) {
        result[k] = defaultValue
      } else if (Array.isArray(current) && Array.isArray(defaultValue)) {
        if (!current.length) {
          result[k] = current
          continue
        }
        const removes = {}
        const indices = []
        let index = 0
        for (let item of current) {
          if (removePrefix === item.substring(0, removePrefix.length)) {
            item = item.substring(removePrefix.length)
            removes[item] = true
            indices.unshift(index)
          }
          index++
        }
        for (const i of indices) current.splice(i, 1)
        defaultValue = defaultValue.filter(item => !removes[item])
        result[k] = defaultValue.concat(current)
      } else if ((typeof current === 'object') && (typeof defaultValue === 'object')) {
        applyDefaults(defaultValue, current)
      }
    }
  }

  const teamMap = {}
  const sortedTeams = []
  for (const from in _config.teams) {
    if (!_config.teams.hasOwnProperty(from)) continue
    const teams = _config.teams[from]
    if (from > isoDate) {
      continue
    }
    sortedTeams.push({ from, teams })
  }
  sortedTeams.sort(compareDateBreaks)

  for (let i = 0; i < sortedTeams.length; i++) {
    const sorted = sortedTeams[i]

    for (const team of sorted.teams) {
      const defaults = teamMap[team.name]
      if (defaults != null) {
        applyDefaults(defaults, team)
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

  _config.teams = []
  for (const name in teamMap) {
    if (!teamMap.hasOwnProperty(name)) continue
    const team = teamMap[name]
    applyDefaults(_config.teamDefaults, team)
    if ((team.sprint != null) && team.sprint.startDate > isoDate) continue
    if (team.members.length === 0) continue
    team.calendar = url.resolve(_config.calendarPrefix, team.calendar)
    team.members.sort((a, b) => a.localeCompare(b))
    _config.teams.push(team)
  }

  _config.teams.sort(compareTeams)

  return _config
}
