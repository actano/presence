import seedrandom from 'seedrandom'
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

class Summary {
  constructor(avail, total) {
    this.avail = avail
    this.total = total
    this.percentage = (100 * this.avail) / this.total
  }
}

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
  console.log(sprintConfig)
  const sprintStartDate = LocalDate.parse(sprintConfig.startDate)
  const weeksSinceSprintStart = sprintStartDate.until(date, ChronoUnit.WEEKS)
  if (weeksSinceSprintStart >= 0 && date.compareTo(sprintStartDate) >= 0) {
    const sprintsSinceFirstStart = Math.floor(weeksSinceSprintStart / sprintConfig.durationWeeks)
    const weeksSinceStart = sprintsSinceFirstStart * sprintConfig.durationWeeks
    const currentStartDate = sprintStartDate.plusWeeks(weeksSinceStart)
    const currentEndDate = currentStartDate.plusWeeks(sprintConfig.durationWeeks).minusDays(1)
    return new Sprint(sprintsSinceFirstStart + sprintConfig.number - 1, currentStartDate, currentEndDate, sprintConfig.scrum)
  }
  return null
}

export default class Team {
  constructor(teamConfig, date, ...calendars) {
    this.calendars = calendars
    this.name = teamConfig.name
    const sob = LocalTime.parse(teamConfig.startOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
    const eob = LocalTime.parse(teamConfig.endOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME)
    this.startOfBusiness = sob.get(ChronoField.MINUTE_OF_DAY)
    this.endOfBusiness = Math.max(this.startOfBusiness + 1, eob.get(ChronoField.MINUTE_OF_DAY))
    this.sprint = initSprint(teamConfig.sprint, date)
    this.status = null
    this.members = []
    for (const name of teamConfig.members) {
      this.members.push(new Member(this.calendars, name))
    }
  }

  selectedMember(date) {
    if (this.sprint.scrum) {
      const avail = []

      for (const member of this.members) {
        const absence = member.absences(date).next().value
        const isAbsent = (absence != null) && absence.date.isSame(date, 'day')
        if (!isAbsent) {
          avail.push(member)
        }
      }

      if (avail.length) {
        const rng = seedrandom(date.format('YYYY-MM-DD'))
        return avail[Math.floor(rng() * avail.length)]
      }
    }
    return null
  }

  sprintSummary() {
    const sprintDays = this.sprint.datesCount()
    const sprintMembers = this.members.length
    const sprintMemberDays = sprintDays * sprintMembers
    let sprintMemberAvailabilities = Number(sprintMemberDays)

    for (const member of this.members) {
      for (const date of this.sprint.dates()) {
        for (const absence of member.absences(toInstant(date), toInstant(date.plusDays(1)))) {
          if (toLocalDate(absence.startDate()).equals(date)) {
            if (absence.isHoliday() || absence.isAbsence()) {
              sprintMemberAvailabilities -= 1
              break
            }
          }
        }
      }
    }

    return new Summary(sprintMemberAvailabilities, sprintMemberDays)
  }
}
