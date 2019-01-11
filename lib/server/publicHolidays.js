import fileUrl from 'file-url'
import events from './calendar'
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
  return events(component, true)
})
