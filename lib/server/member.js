export default class Member {
  constructor(events, name) {
    const checkEvent = (event) => {
      if (event.isHoliday()) {
        return true
      }

      for (const attendee of event.attendees()) {
        if (attendee.cn() === name) {
          return true
        }
      }

      return false
    }

    this.events = events.filter(checkEvent)
    this.name = name
  }
}
