import events, { icalFromURL } from './calendar'
import _config from './config'
import withConfluenceType from './confluence'
import _debug from './debug'
import { memberModel, scrumTeamModel, scrumTimeRange, timeRange } from './model'
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
    const { component, mtime: cacheTimestamp } = await icalFromURL(teamConfig.calendar)

    d('creating calendar')
    const teamCalendarEvents = events(component).map(event => withConfluenceType(event))
    const teamEvents = holidayCalendar.concat(teamCalendarEvents)
    d('calculating range')
    const { start, end } = scrumTimeRange(timeRange(currentDate), teamConfig.sprint, currentDate)

    d('creating member models')
    const startInstant = toInstant(start)
    const endInstant = toInstant(end)
    const members = teamConfig.members.map(member =>
      memberModel(member, teamEvents, startInstant, endInstant))

    d('creating team model')
    const range = {
      currentDate: currentDate.toString(),
      start: start.toString(),
      end: end.toString(),
    }

    const { name } = teamConfig
    const team = {
      name, ...businessTimes(teamConfig), cacheTimestamp, range, members,
    }
    const sprint = fromSprintConfig(teamConfig.sprint, currentDate)
    const result = scrumTeamModel(sprint, team)
    d('[done] create presence for %s', currentDate)
    return result
  }

  return Promise.all(teams.map(updateTeamAbsence)).finally(() => {
    debug('[done] create presence for %s', currentDate)
  })
}
