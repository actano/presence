import {
  LocalDate,
  LocalTime,
  ChronoField,
  ChronoUnit,
  DateTimeFormatter,
  DayOfWeek,
} from 'js-joda'
import Member from './member'
import { toLocalDate, toInstant } from './util'

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

  datesCount() {
    let result = 0
    const iter = this.dates()
    while (!iter.next().done) {
      result += 1
    }
    return result
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
  constructor(teamConfig, date, events) {
    this.name = teamConfig.name
    const sob = LocalTime.parse(teamConfig.startOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
    const eob = LocalTime.parse(teamConfig.endOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
    this.startOfBusiness = sob.get(ChronoField.MINUTE_OF_DAY)
    this.endOfBusiness = Math.max(this.startOfBusiness + 1, eob.get(ChronoField.MINUTE_OF_DAY))
    this.sprint = initSprint(teamConfig.sprint, date)
    this.status = null
    this.members = []
    for (const name of teamConfig.members) {
      this.members.push(new Member(events, name))
    }
  }

  sprintSummary() {
    const sprintDays = this.sprint.datesCount()
    const sprintMembers = this.members.length
    const total = sprintDays * sprintMembers
    let avail = Number(total)

    for (const member of this.members) {
      for (const date of this.sprint.dates()) {
        for (const absence of member.absences(toInstant(date), toInstant(date.plusDays(1)))) {
          if (toLocalDate(absence.startDate()).equals(date)) {
            if (absence.isHoliday() || absence.isAbsence()) {
              avail -= 1
              break
            }
          }
        }
      }
    }

    return { avail, total }
  }
}
