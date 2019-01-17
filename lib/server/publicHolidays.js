import events, { icalFromURL } from './calendar'
import { LEAVES } from './eventType'
import withCache from './withCache'

export default withCache(60 * 60, async () => {
  const { component } = await icalFromURL('./calendars/public-holidays_de.ics')
  const type = LEAVES
  return events(component).map(event => ({ ...event, type }))
})
