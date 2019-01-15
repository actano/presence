import events from './calendar'
import _config from './config'
import _debug from './debug'
import icsFromURL from './ics-from-url'
import Member from './member'
import teamModel, { memberModel, timeRange } from './model'
import publicHolidays from './publicHolidays'
import { businessTimes, fromSprintConfig } from './team'
import { toInstant } from './util'

const debug = _debug.extend('absence-cache')

export default async function updateAbsence(currentDate) {
  const { teams } = await _config(currentDate)
  debug('[begin] create presence for %s', currentDate)

  const holidayCalendar = await publicHolidays()

  const updateTeamAbsence = async (teamConfig) => {
    const d = debug.extend(teamConfig.name)
    d('[begin] create presence for %s', currentDate)
    const { component, mtime: cacheTimestamp } = await icsFromURL(teamConfig.calendar)

    d('creating calendar')
    const teamEvents = holidayCalendar.concat(events(component))
    d('creating team')
    const { name } = teamConfig
    const sprint = fromSprintConfig(teamConfig.sprint, currentDate)
    const team = {
      name, ...businessTimes(teamConfig), sprint,
    }
    const { start, end } = timeRange(sprint, currentDate)

    d('creating team model')
    const startInstant = toInstant(start)
    const endInstant = toInstant(end)
    const members = teamConfig.members.map(memberName =>
      memberModel(new Member(teamEvents, memberName), startInstant, endInstant))
    const result = teamModel(team, {
      start, end, members, currentDate, cacheTimestamp,
    })
    d('[done] create presence for %s', currentDate)
    return result
  }

  return Promise.all(teams.map(updateTeamAbsence)).finally(() => {
    debug('[done] create presence for %s', currentDate)
  })
}
