import Absence from './absence'

export default class Member {
  constructor(calendars, name) {
    this.calendars = calendars
    this.name = name
  }

  * events() {
    for (const calendar of this.calendars) {
      for (const event of calendar.events()) {
        if (event.calendar.holidays) {
          yield event
          continue
        }

        for (const attendee of event.attendees()) {
          if (attendee.cn() === this.name) {
            yield event
            break
          }
        }
      }
    }
  }

  * absences(startDate, endDate) {
    const absences = Absence.fromEvents(this.events(), this, startDate, endDate)
    if (!endDate) {
      yield* absences
      return
    }
    for (const absence of absences) {
      if (absence.startDate().isAfter(endDate)) break
      yield absence
    }
  }
}
