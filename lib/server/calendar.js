import ICAL from 'ical.js'
import { HOLIDAY } from './eventType'
import { icalTimetoInstant } from './icalCompatibility'

class Event {
  constructor(icalEvent, holiday) {
    this.icalEvent = icalEvent
    this.startDate = icalTimetoInstant(icalEvent.startDate)
    if (holiday) {
      this.type = HOLIDAY
    } else {
      this.type = icalEvent.component.jCal[1]
        .filter(([name]) => name === 'x-confluence-subcalendar-type')
        .map(([, , , value]) => value).shift()
    }
    this.attendees = icalEvent.attendees.map(attendee => attendee.getParameter('cn'))
  }

  name() {
    return this.icalEvent.summary.split(':')[0]
  }
}

export default (component, holiday = false) => component.getAllSubcomponents('vevent')
  .map(event => new Event(new ICAL.Event(event), holiday))
