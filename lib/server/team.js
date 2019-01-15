import {
  LocalDate,
  LocalTime,
  ChronoField,
  ChronoUnit,
  DateTimeFormatter,
  DayOfWeek,
} from 'js-joda'

export function* sprintDates(start, end) {
  let date = start
  while (!date.isAfter(end)) {
    if (date.dayOfWeek() !== DayOfWeek.SUNDAY && date.dayOfWeek() !== DayOfWeek.SATURDAY) {
      yield date
    }
    date = date.plusDays(1)
  }
}

export function fromSprintConfig(sprintConfig, date) {
  if (!sprintConfig) return null

  const sprintStartDate = LocalDate.parse(sprintConfig.startDate)
  const weeksSinceSprintStart = sprintStartDate.until(date, ChronoUnit.WEEKS)
  if (weeksSinceSprintStart >= 0 && date.compareTo(sprintStartDate) >= 0) {
    const sprintsSinceFirstStart = Math.floor(weeksSinceSprintStart / sprintConfig.durationWeeks)
    const weeksSinceStart = sprintsSinceFirstStart * sprintConfig.durationWeeks
    const start = sprintStartDate.plusWeeks(weeksSinceStart)
    const end = start.plusWeeks(sprintConfig.durationWeeks).minusDays(1)
    const count = (sprintsSinceFirstStart + sprintConfig.number) - 1
    const { scrum } = sprintConfig
    const dates = Array.from(sprintDates(start, end))
    return {
      count, start, end, scrum, dates,
    }
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
