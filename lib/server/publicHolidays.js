import events, { icalFromURL } from './calendar'
import withCache from './withCache'

export default withCache(async () => {
  const { component } = await icalFromURL('./calendars/public-holidays_de.ics')
  return events(component).map(event => ({ ...event, type: 'HOLIDAY' }))
})
