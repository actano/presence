export default class Absence {
  constructor(member, event, day) {
    this.member = member
    this.event = event
    this.day = day
  }

  isHoliday() {
    return this.event.calendar.holidays
  }

  isTravel() {
    return this.event.isTravel()
  }

  isAbsence() {
    return !(this.isHoliday() || this.isTravel())
  }

  startDate() {
    return this.day.startDate()
  }
}

Absence.fromEvents = function* fromEvents(eventIterator, member, start, end) {
  for (const event of eventIterator) {
    for (const instance of event.instances(start, end)) {
      for (const day of instance.days(start)) {
        if (day.startDate().isAfter(end)) break
        yield new Absence(member, instance.event, day)
      }
    }
  }
}
