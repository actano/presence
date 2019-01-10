import fileUrl from 'file-url'
import Calendar from './calendar'
import icsFromURL from './ics-from-url'

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
  const { component } = await icsFromURL(fileUrl('./calendars/public-holidays_de.ics'))
  const holidayCalendar = new Calendar(component)
  holidayCalendar.holidays = true
  return holidayCalendar
})
