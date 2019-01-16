import { icalHeaders } from './calendar'

export const confluenceType = icalEvent => icalHeaders(icalEvent, 'x-confluence-subcalendar-type').shift()

export default (event) => {
  const { icalEvent } = event
  const type = confluenceType(icalEvent)
  return { ...event, type }
}
