import { Instant, LocalDate } from 'js-joda'
import { toInstant } from './util'

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
