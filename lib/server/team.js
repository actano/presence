import {
  LocalDate,
  LocalTime,
  ChronoField,
  ChronoUnit,
  DateTimeFormatter,
  DayOfWeek,
} from 'js-joda'

function* daysOfSprint(start, end) {
  let date = start
  while (!date.isAfter(end)) {
    if (date.dayOfWeek() !== DayOfWeek.SUNDAY && date.dayOfWeek() !== DayOfWeek.SATURDAY) {
      yield date.toString()
    }
    date = date.plusDays(1)
  }
}

export function sprintDates(sprintConfig, date) {
  if (!sprintConfig) return null

  const sprintStartDate = LocalDate.parse(sprintConfig.startDate)
  const weeksSinceSprintStart = sprintStartDate.until(date, ChronoUnit.WEEKS)
  if (weeksSinceSprintStart >= 0 && date.compareTo(sprintStartDate) >= 0) {
    const sprintsSinceFirstStart = Math.floor(weeksSinceSprintStart / sprintConfig.durationWeeks)
    const weeksSinceStart = sprintsSinceFirstStart * sprintConfig.durationWeeks
    const start = sprintStartDate.plusWeeks(weeksSinceStart)
    const end = start.plusWeeks(sprintConfig.durationWeeks).minusDays(1)
    const count = (sprintsSinceFirstStart + sprintConfig.number) - 1
    return { start, end, count }
  }
  return null
}

export function fromSprintConfig(sprintConfig, date) {
  const { start, end, count } = sprintDates(sprintConfig, date) || {}
  if (!start) return null

  const dates = Array.from(daysOfSprint(start, end))
  const { scrum } = sprintConfig
  return {
    count, number: count + 1, start: start.toString(), end: end.toString(), scrum, dates,
  }
}

export const businessTimes = ({ startOfBusiness, endOfBusiness }) => {
  const sob = LocalTime.parse(startOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
  const eob = LocalTime.parse(endOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
  const sobMinutes = sob.get(ChronoField.MINUTE_OF_DAY)
  const eobMinutes = Math.max(sobMinutes + 1, eob.get(ChronoField.MINUTE_OF_DAY))
  return { startOfBusiness: sobMinutes, endOfBusiness: eobMinutes }
}
