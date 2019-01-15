import {
  LocalDate,
  LocalTime,
  ChronoField,
  ChronoUnit,
  DateTimeFormatter,
  DayOfWeek,
} from 'js-joda'
import Member from './member'

class Sprint {
  constructor(count, start, end, scrum) {
    this.count = count
    this.start = start
    this.end = end
    this.scrum = scrum
  }

  * dates() {
    let date = this.start
    while (!date.isAfter(this.end)) {
      if (date.dayOfWeek() !== DayOfWeek.SUNDAY && date.dayOfWeek() !== DayOfWeek.SATURDAY) {
        yield date
      }
      date = date.plusDays(1)
    }
  }
}

function initSprint(sprintConfig, date) {
  if (!sprintConfig) return null

  const sprintStartDate = LocalDate.parse(sprintConfig.startDate)
  const weeksSinceSprintStart = sprintStartDate.until(date, ChronoUnit.WEEKS)
  if (weeksSinceSprintStart >= 0 && date.compareTo(sprintStartDate) >= 0) {
    const sprintsSinceFirstStart = Math.floor(weeksSinceSprintStart / sprintConfig.durationWeeks)
    const weeksSinceStart = sprintsSinceFirstStart * sprintConfig.durationWeeks
    const currentStartDate = sprintStartDate.plusWeeks(weeksSinceStart)
    const currentEndDate = currentStartDate.plusWeeks(sprintConfig.durationWeeks).minusDays(1)
    const sprintNumber = (sprintsSinceFirstStart + sprintConfig.number) - 1
    return new Sprint(sprintNumber, currentStartDate, currentEndDate, sprintConfig.scrum)
  }
  return null
}

export default class Team {
  constructor(teamConfig, date) {
    this.name = teamConfig.name
    const sob = LocalTime.parse(teamConfig.startOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
    const eob = LocalTime.parse(teamConfig.endOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
    this.startOfBusiness = sob.get(ChronoField.MINUTE_OF_DAY)
    this.endOfBusiness = Math.max(this.startOfBusiness + 1, eob.get(ChronoField.MINUTE_OF_DAY))
    this.sprint = initSprint(teamConfig.sprint, date)
    this.status = null
  }
}
