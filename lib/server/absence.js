export default class Absence {
  constructor(member, event, day) {
    this.member = member
    this.event = event
    this.day = day
  }

  isHoliday() {
    return this.event.isHoliday()
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
