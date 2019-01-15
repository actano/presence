import ICAL from 'ical.js'
import { icalTimetoInstant } from './icalCompatibility'

class Attendee {
  constructor(property) {
    this.property = property
  }

  cn() {
    return this.property.getParameter('cn')
  }
}

const types = (icalEvent, holiday) => {
  const result = {}
  const confluenceTypes = icalEvent.component.jCal[1]
    .filter(([name]) => name === 'x-confluence-subcalendar-type')
    .map(([, , , value]) => value)
  confluenceTypes.forEach((type) => {
    result[type] = type
  })
  if (holiday) {
    result.holiday = 'holiday'
  }
  return result
}

class Event {
  constructor(icalEvent, holiday) {
    this.icalEvent = icalEvent
    this.startDate = icalTimetoInstant(icalEvent.startDate)
    this.types = types(icalEvent, holiday)
  }

  isHoliday() {
    return this.types.holiday
  }

  isTravel() {
    return this.types.travel
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

  * attendees() {
    const { attendees } = this.icalEvent
    for (const attendee of attendees) {
      yield new Attendee(attendee)
    }
  }
}

export default (component, holiday = false) => component.getAllSubcomponents('vevent')
  .map(event => new Event(new ICAL.Event(event), holiday))
