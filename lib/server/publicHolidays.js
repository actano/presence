import events from './calendar'
import icsFromURL from './ics-from-url'
import withCache from './withCache'

export default withCache(async () => {
  const { component } = await icsFromURL('./calendars/public-holidays_de.ics')
  return events(component).map(event => ({ ...event, type: 'HOLIDAY' }))
})
