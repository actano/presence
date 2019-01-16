const checkEvent = (event, name) => {
  if (event.isHoliday()) {
    return true
  }

  for (const attendee of event.attendees) {
    if (attendee === name) {
      return true
    }
  }

  return false
}

export const memberEvents = (events, name) => events.filter(event => checkEvent(event, name))
