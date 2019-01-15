import events from './calendar'
import _config from './config'
import _debug from './debug'
import icsFromURL from './ics-from-url'
import Member from './member'
import teamModel, { memberModel, timeRange } from './model'
import publicHolidays from './publicHolidays'
import Team from './team'
import { toInstant } from './util'

const debug = _debug.extend('absence-cache')

export default async function updateAbsence(currentDate) {
  const { teams } = await _config(currentDate)
  debug('[begin] create presence for %s', currentDate)

  const holidayCalendar = await publicHolidays()

  const updateTeamAbsence = async (team) => {
    const d = debug.extend(team.name)
    d('[begin] create presence for %s', currentDate)
    const { component, mtime: cacheTimestamp } = await icsFromURL(team.calendar)

    d('creating calendar')
    const calendar = events(component)
    d('creating team')
    const teamEvents = holidayCalendar.concat(calendar)
    const _team = new Team(team, currentDate)
    d('creating team model')
    const { start, end } = timeRange(_team.sprint, currentDate)
    const startInstant = toInstant(start)
    const endInstant = toInstant(end)
    const _members = team.members.map(name => new Member(teamEvents, name))
    const members = _members.map(member => memberModel(member, startInstant, endInstant))
    const result = teamModel(_team, { start, end, members, currentDate, cacheTimestamp })
    d('[done] create presence for %s', currentDate)
    return result
  }

  return Promise.all(teams.map(updateTeamAbsence)).finally(() => {
    debug('[done] create presence for %s', currentDate)
  })
}
