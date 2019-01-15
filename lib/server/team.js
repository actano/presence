import {
  LocalDate,
  LocalTime,
  ChronoField,
  ChronoUnit,
  DateTimeFormatter,
  DayOfWeek,
} from 'js-joda'

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

export function fromSprintConfig(sprintConfig, date) {
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

export const businessTimes = ({ startOfBusiness, endOfBusiness }) => {
  const sob = LocalTime.parse(startOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
  const eob = LocalTime.parse(endOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
  const sobMinutes = sob.get(ChronoField.MINUTE_OF_DAY)
  const eobMinutes = Math.max(sobMinutes + 1, eob.get(ChronoField.MINUTE_OF_DAY))
  return { startOfBusiness: sobMinutes, endOfBusiness: eobMinutes }
}
