import events from './calendar'
import _config from './config'
import _debug from './debug'
import icsFromURL from './ics-from-url'
import teamModel from './model'
import publicHolidays from './publicHolidays'
import Team from './team'

const debug = _debug.extend('absence-cache')

export default async function updateAbsence(userDate) {
  const { teams } = await _config(userDate)
  debug('[begin] create presence for %s', userDate)

  const holidayCalendar = await publicHolidays()

  const updateTeamAbsence = async (team) => {
    const d = debug.extend(team.name)
    d('[begin] create presence for %s', userDate)
    const { component, mtime } = await icsFromURL(team.calendar)

    d('creating calendar')
    const calendar = events(component)
    d('creating team')
    const _team = new Team(team, userDate, holidayCalendar.concat(calendar))
    _team.cacheTimestamp = mtime
    d('creating team model')
    const result = teamModel(_team, userDate)
    d('[done] create presence for %s', userDate)
    return result
  }

  return Promise.all(teams.map(updateTeamAbsence)).finally(() => {
    debug('[done] create presence for %s', userDate)
  })
}
