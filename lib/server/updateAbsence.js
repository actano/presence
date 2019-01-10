import { readFile } from 'fs'
import { promisify } from 'util'
import path from 'path'
import _config from './config'
import icsFromURL from './ics-from-url'
import Calendar from './calendar'
import Team from './team'
import teamModel from './model'

const readFileAsync = promisify(readFile)

// load team meta data

export default async function updateAbsence(userDate) {
  const config = _config(userDate)

  const holidayPath = path.join(path.dirname(__dirname), 'calendars', 'public-holidays_de.ics')
  const holidayCalendarData = await readFileAsync(holidayPath, 'utf-8')
  const holidayCalendar = new Calendar(holidayCalendarData)
  holidayCalendar.holidays = true

  const updateTeamAbsence = async (team) => {
    const teamCalendarData = await icsFromURL(team.calendar)

    const result = new Team(team, userDate, holidayCalendar, new Calendar(teamCalendarData.content))
    result.cacheTimestamp = teamCalendarData.mtime
    return teamModel(result, userDate)
  }

  const results = []
  for (const team of config.teams) {
    results.push(updateTeamAbsence(team))
  }
  // await writeFileAsync('results.json', JSON.stringify(results));
  return Promise.all(results)
}
