import ICAL from 'ical.js'
import { Instant, LocalDate } from 'js-joda'
import fetch from './fetch'
import { toInstant } from './util'
import withCache from './withCache'

export function* icalIterator(icalObj) {
  const iterator = icalObj.iterator()
  let v = iterator.next()
  while (v != null) {
    yield v
    v = iterator.next()
  }
}

export function icalTimetoInstant(date) {
  if (date == null) return null
  if (date.isDate) {
    // TODO support LocalDate on caller site
    return toInstant(LocalDate.of(date.year, date.month, date.day))
  }
  // TODO this magically works, if confluence ICS and node are in the same timezone,
  // TODO since ICAL seems to neither detect localTimezone correct nor does it detect ICS timezone
  // TODO should use date.toUnixTime() if TZ detection works
  return Instant.ofEpochMilli(date.toJSDate().getTime())
}

export const icalStartDate = icalEvent => icalTimetoInstant(icalEvent.startDate)

export const icalHeaders = (icalEvent, name) => icalEvent.component.jCal[1]
  .filter(([headerName]) => headerName === name)
  .map(([, , , value]) => value)

export const icalAttendees = icalEvent => icalEvent.attendees.map(attendee => attendee.getParameter('cn'))

export const icalFromURL = withCache(5 * 60, async (url) => {
  const mtime = Date.now()
  const result = await fetch(url)
  const component = new ICAL.Component(ICAL.parse(result.body))
  return { ...result, component, mtime }
})

export default component => component.getAllSubcomponents('vevent')
  .map((event) => {
    const icalEvent = new ICAL.Event(event)
    const startDate = icalStartDate(icalEvent)
    const attendees = icalAttendees(icalEvent)
    return {
      icalEvent, startDate, attendees,
    }
  })
