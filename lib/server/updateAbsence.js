import Calendar from './calendar'
import _config from './config'
import icsFromURL from './ics-from-url'
import teamModel from './model'
import publicHolidays from './publicHolidays'
import Team from './team'

// load team meta data

export default async function updateAbsence(userDate) {
  const config = await _config(userDate)

  const holidayCalendar = await publicHolidays()

  const updateTeamAbsence = async (team) => {
    const teamCalendarData = await icsFromURL(team.calendar)

    const result = new Team(team, userDate, holidayCalendar, new Calendar(teamCalendarData.content))
    result.cacheTimestamp = teamCalendarData.mtime
    return teamModel(result, userDate)
  }

  return Promise.all(config.teams.map(updateTeamAbsence))
}
