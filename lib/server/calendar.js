import assert from 'assert'

import ICAL from 'ical.js'
import { Instant, LocalDate } from 'js-joda'

import { toInstant, toLocalDate } from './util'

export function* filterAfter(start, iter) {
  for (const date of iter) {
    if (!date.endDate.isBefore(start)) {
      yield date
    }
  }
}

function* icalIterator(icalObj) {
  const iterator = icalObj.iterator()
  let v = iterator.next()
  while (v != null) {
    yield v
    v = iterator.next()
  }
}

function icalTimetoInstant(date) {
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

export function* daysOf(start, end) {
  let startDate = start
  let next = toLocalDate(startDate).plusDays(1)
  while (startDate.isBefore(end)) {
    let endDate = toInstant(next)
    if (end.compareTo(endDate) < 0) endDate = end
    yield { startDate, endDate }
    startDate = endDate
    next = next.plusDays(1)
  }
}

class Attendee {
  constructor(property) {
    this.property = property
  }

  cn() {
    return this.property.getParameter('cn')
  }
}

export function* instances(event) {
  const duration = event.duration()
  if (!event.icalEvent.isRecurring()) {
    const startDate = icalTimetoInstant(event.icalEvent.startDate)
    const endDate = startDate.plusSeconds(duration)
    yield { event, startDate, endDate }
    return
  }

  for (const v of icalIterator(event.icalEvent)) {
    const startDate = icalTimetoInstant(v)
    const endDate = startDate.plusSeconds(duration)
    yield { event, startDate, endDate }
  }
}

export function* instancesAfter(event, startTime) {
  assert(startTime instanceof Instant)
  yield* filterAfter(startTime, instances(event))
}

export function* instancesBetween(event, startTime, endTime) {
  assert(endTime instanceof Instant)
  for (const instance of instancesAfter(event, startTime)) {
    if (!instance.startDate.isBefore(endTime)) break
    yield instance
  }
}

class Event {
  constructor(icalEvent, holiday) {
    this.icalEvent = icalEvent
    this._holiday = holiday
    this.startDate = icalTimetoInstant(icalEvent.startDate)
  }

  isHoliday() {
    return this._holiday
  }

  isTravel() {
    // TODO destructuring array support for eslint
    // eslint-disable-next-line no-unused-vars
    return this.icalEvent.component.jCal[1].some(([name, meta, type, value]) => name === 'x-confluence-subcalendar-type' && value === 'travel')
  }

  // name ('Who and Description are separated by :')
  summary() {
    return this.icalEvent.summary.split(':')[1]
  }

  name() {
    return this.icalEvent.summary.split(':')[0]
  }

  description() {
    return this.icalEvent.description
  }

  duration() {
    return this.icalEvent.duration.toSeconds()
  }

  confluenceCalendarType() {
    return this.icalEvent.component.getFirstPropertyValue('x-confluence-subcalendar-type')
  }

  * attendees() {
    const { attendees } = this.icalEvent
    for (const attendee of attendees) {
      yield new Attendee(attendee)
    }
  }
}

export default (component, holiday = false) => component.getAllSubcomponents('vevent')
  .map(event => new Event(new ICAL.Event(event), holiday))
