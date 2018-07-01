import ICAL from 'ical.js'
import { Instant, LocalDate } from 'js-joda'
import { toInstant, toLocalDate } from './util'

function* filterAfter(start, iter) {
  for (const date of iter) {
    if (!date.endDate().isBefore(start)) {
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
  if (date.isDate) {
    // TODO support LocalDate on caller site
    return toInstant(LocalDate.of(date.year, date.month, date.day))
  }
  // TODO this magically works, if confluence ICS and node are in the same timezone,
  // TODO since ICAL seems to neither detect localTimezone correct nor does it detect ICS timezone
  // TODO should use date.toUnixTime() if TZ detection works
  return Instant.ofEpochMilli(date.toJSDate().getTime())
}

class Day {
  constructor(start, end) {
    this._start = start
    this._end = end
  }

  startDate() {
    return this._start
  }

  endDate() {
    return this._end
  }
}

class Instance {
  constructor(event, date) {
    this.event = event
    this._date = date
    this._end = this._date.plusSeconds(this.event.duration())
  }

  startDate() {
    return this._date
  }

  endDate() {
    return this._end
  }

  * days(start) {
    if (start != null) {
      yield* filterAfter(start, this.days())
      return
    }
    let startDate = this.startDate()
    const endDate = this.endDate()
    let next = toLocalDate(startDate).plusDays(1)
    while (startDate.isBefore(endDate)) {
      let end = toInstant(next)
      if (endDate.compareTo(end) < 0) end = endDate
      yield new Day(startDate, end)
      startDate = end
      next = next.plusDays(1)
    }
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

class Event {
  constructor(calendar, icalEvent) {
    this.calendar = calendar
    this.icalEvent = icalEvent
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

  startDate() {
    const date = this.icalEvent.startDate
    if (date == null) {
      return null
    }
    return icalTimetoInstant(date)
  }

  duration() {
    return this.icalEvent.duration.toSeconds()
  }

  * instances(startTime, endTime) {
    if (endTime) {
      for (const instance of this.instances(startTime)) {
        if (!instance.startDate().isBefore(endTime)) break
        yield instance
      }
      return
    }

    if (startTime != null) {
      let startInstance = startTime
      if (!(startTime instanceof Instant)) {
        // TODO localDate support
        startInstance = toInstant(startTime)
      }
      yield* filterAfter(startInstance, this.instances())
      return
    }

    if (!this.icalEvent.isRecurring()) {
      yield new Instance(this, this.startDate())
      return
    }

    for (const v of icalIterator(this.icalEvent)) {
      const date = icalTimetoInstant(v)
      yield new Instance(this, date)
    }
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

export default class Calendar {
  constructor(content) {
    this.component = new ICAL.Component(ICAL.parse(content))
  }

  * events() {
    // each logical item in the confluence calendar
    // is a 'vevent'; lookup all events of that type
    const vevents = this.component.getAllSubcomponents('vevent')
    for (const event of vevents) {
      yield new Event(this, new ICAL.Event(event))
    }
  }
}
