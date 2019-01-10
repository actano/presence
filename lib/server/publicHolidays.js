import { readFile } from 'fs'
import { promisify } from 'util'

import Calendar from './calendar'

const readFileAsync = promisify(readFile)

const withCache = (fn) => {
  let cached = false
  let cache
  return () => {
    if (!cached) {
      cache = fn()
      cached = true
    }
    return cache
  }
}

export default withCache(async () => {
  const holidayPath = 'calendars/public-holidays_de.ics'
  const holidayCalendarData = await readFileAsync(holidayPath, 'utf-8')
  const holidayCalendar = new Calendar(holidayCalendarData)
  holidayCalendar.holidays = true
  return holidayCalendar
})
