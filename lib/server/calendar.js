import ICAL from 'ical.js'
import { icalTimetoInstant } from './icalCompatibility'

export const icalStartDate = icalEvent => icalTimetoInstant(icalEvent.startDate)

export const icalType = icalEvent => icalEvent.component.jCal[1]
  .filter(([name]) => name === 'x-confluence-subcalendar-type')
  .map(([, , , value]) => value).shift()

export const icalAttendees = icalEvent => icalEvent.attendees.map(attendee => attendee.getParameter('cn'))

export default (component, holiday = false) => component.getAllSubcomponents('vevent')
  .map((event) => {
    const icalEvent = new ICAL.Event(event)
    const startDate = icalStartDate(icalEvent)
    const type = icalType(icalEvent, holiday)
    const attendees = icalAttendees(icalEvent)
    return {
      icalEvent, startDate, type, attendees,
    }
  })
