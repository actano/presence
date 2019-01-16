import yaml from 'js-yaml'
import _debug from './debug'
import fetch from './fetch'
import withCache from './withCache'

const debug = _debug.extend('config')

function compareTeams(a, b) {
  if (a.weight < b.weight) return -1
  if (a.weight > b.weight) return 1
  return a.name.localeCompare(b.name)
}

const isString = obj => typeof obj === 'string' || obj instanceof String

const removePrefix = ':'

const parseTeamMember = (member) => {
  if (isString(member)) {
    const remove = member.substring(0, removePrefix.length) === removePrefix
    const name = remove ? member.substring(removePrefix.length) : member
    return { name, remove }
  }
  return member
}

const parseTeamMembers = (members) => {
  if (!members) return []
  if (!Array.isArray(members)) return [parseTeamMember(members)]
  if (!members.length) return [{ remove: true }]
  return members.map(parseTeamMember)
}

const parseTeam = (team) => {
  const members = parseTeamMembers(team.members)
  return { ...team, members }
}

const parseTeams = (teams) => {
  if (!Array.isArray(teams)) return parseTeams([teams])
  return teams.map(parseTeam)
}

const parseDates = (dateTeams) => {
  const result = []
  for (const date of Object.keys(dateTeams)) {
    result.push(...parseTeams(dateTeams[date]).map(team => ({ ...team, date })))
  }
  return result
}

const merge = (a, b) => {
  const result = { ...a, ...b }
  for (const key of Object.keys(b)) {
    const bValue = b[key]
    const aValue = a[key]
    if (Array.isArray(bValue) && Array.isArray(aValue)) {
      result[key] = [...aValue, ...bValue]
    } else if (typeof bValue === 'object' && typeof aValue === 'object') {
      result[key] = merge(aValue, bValue)
    }
  }
  return result
}

const mergeByName = (obj, current) => {
  const prev = current.get(obj.name)
  if (!prev) {
    current.set(obj.name, obj)
    return obj
  }
  const result = merge(prev, obj)
  current.set(result.name, result)
  return result
}

const compareTeamsWithDate = (a, b) => {
  if (a.date < b.date) return -1
  if (a.date > b.date) return 1
  return compareTeams(a, b)
}

const reduceMember = (map, member) => {
  if (member.remove && !member.name) {
    map.clear()
  } else {
    mergeByName(member, map)
  }
  return map
}

const filter = (iterable, callbackFn) => Array.from(iterable).filter(callbackFn)

const map = (iterable, callbackFn) => Array.from(iterable).map(callbackFn)

const binarySearch = (array, pred) => {
  let lo = -1
  let hi = array.length
  while (1 + lo < hi) {
    // eslint-disable-next-line no-bitwise
    const mi = lo + ((hi - lo) >> 1)
    if (pred(array[mi])) {
      hi = mi
    } else {
      lo = mi
    }
  }
  return hi
}

export const parseConfig = (_config) => {
  debug('[begin] create config')
  const parsedTeams = parseDates(_config.teams).sort(compareTeamsWithDate)

  const reduceStartDates = (_map, { name, date }) => {
    if (!_map.has(name)) _map.set(name, date)
    return _map
  }
  const teamStartDates = parsedTeams.reduce(reduceStartDates, new Map())

  const teamDefaults = parseTeam(_config.teamDefaults || {})
  const mapTeamDefaults = ([name, startDate]) =>
    [name, merge(teamDefaults, { name, sprint: { startDate } })]

  const teamMap = new Map(map(teamStartDates, mapTeamDefaults))
  const reduceTeam = (_dateMap, next) => {
    const team = mergeByName(next, teamMap)
    const key = team.date
    _dateMap.set(key, Array.from(teamMap.values()))
    return _dateMap
  }
  const dateMap = parsedTeams.reduce(reduceTeam, new Map())

  const timeline = Array.from(dateMap).map(([date, _teams]) => {
    const teams = _teams
      .map((team) => {
        const calendar = _config.calendarPrefix + team.calendar
        const memberMap = team.members.reduce(reduceMember, new Map())
        const members = filter(memberMap.values(), ({ remove }) => !remove)
          .map(({ name }) => name).sort((a, b) => a.localeCompare(b))
        if (!team.sprint || team.sprint.startDate) {
          return { ...team, calendar, members }
        }
        const sprint = { ...team.sprint, startDate: team.date }
        return {
          ...team, calendar, members, sprint,
        }
      })
      .filter(({ members }) => members.length > 0)
      .sort(compareTeams)
    return { date, teams }
  })
  debug('[done] create config')
  return timeline
}

const fetchConfig = withCache(5 * 60, async () => {
  const { body } = await fetch(process.env.CONFIG)
  const _config = yaml.safeLoad(body)
  const teams = parseConfig(_config)
  return { ..._config, teams }
})

export default async (isoDate) => {
  const config = await fetchConfig()
  const index = binarySearch(config.teams, ({ date }) => isoDate < date)
  const teams = index === 0 ? [] : config.teams[index - 1].teams
  return { ...config, teams }
}
