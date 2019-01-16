import ICAL from 'ical.js'
import { icalTimetoInstant } from './icalCompatibility'

const types = (icalEvent, holiday) => {
  const confluenceTypes = icalEvent.component.jCal[1]
    .filter(([name]) => name === 'x-confluence-subcalendar-type')
    .map(([, , , value]) => value)
  if (holiday) {
    confluenceTypes.push('holiday')
  }
  return confluenceTypes
}

class Event {
  constructor(icalEvent, holiday) {
    this.icalEvent = icalEvent
    this.startDate = icalTimetoInstant(icalEvent.startDate)
    this.types = types(icalEvent, holiday)
    this.attendees = icalEvent.attendees.map(attendee => attendee.getParameter('cn'))
  }

  isHoliday() {
    return this.types.includes('holiday')
  }

  isTravel() {
    return this.types.includes('travel')
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
}

export default (component, holiday = false) => component.getAllSubcomponents('vevent')
  .map(event => new Event(new ICAL.Event(event), holiday))
