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
