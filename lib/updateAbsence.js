import fs from 'fs'
import path from 'path'
import { coroutine, promisifyAll } from 'bluebird'
import _config from './config'
import icsFromURL from './ics-from-url'
import Calendar from './calendar'
import Team from './team'
import teamModel from './model'

promisifyAll(fs)

// load team meta data
export default coroutine(function* updateAbsence(userDate) {
  const config = _config(userDate)

  const holidayPath = path.join(path.dirname(__dirname), 'calendars', 'public-holidays_de.ics')
  const holidayCalendarData = yield fs.readFileAsync(holidayPath, 'utf-8')
  const holidayCalendar = new Calendar(holidayCalendarData)
  holidayCalendar.holidays = true

  const results = []
  for (let i = 0; i < config.teams.length; i++) {
    const team = config.teams[i]
    const teamCalendarData = yield icsFromURL(team.calendar)

    const result = new Team(team, userDate, holidayCalendar, new Calendar(teamCalendarData.content))
    result.cacheTimestamp = teamCalendarData.mtime
    results.push(teamModel(result, userDate))
  }
    // yield fs.writeFileAsync('results.json', JSON.stringify(results));
  return results
})
