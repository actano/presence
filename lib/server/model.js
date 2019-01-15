import { ChronoUnit } from 'js-joda'
import { daysOf, filterAfter, instancesBetween } from './instances'
import { startOfDay, startOfWeek, toLocalDate } from './util'

function eventType(event) {
  if (event.isHoliday()) return 'holiday'
  if (event.isTravel()) return 'travel'
  return 'absence'
}

function* absences(member, startDate, endDate) {
  for (const event of member.events) {
    for (const instance of instancesBetween(event, startDate, endDate)) {
      for (const day of filterAfter(startDate, daysOf(instance.startDate, instance.endDate))) {
        if (day.startDate.isAfter(endDate)) return
        const date = toLocalDate(day.startDate).toString()
        const zero = startOfDay(day.startDate)
        const absence = {
          id: instance.event.icalEvent.uid,
          start: zero.until(day.startDate, ChronoUnit.MINUTES),
          end: zero.until(day.endDate, ChronoUnit.MINUTES),
          type: eventType(instance.event),
        }
        yield { date, absence }
      }
    }
  }
}

export function memberModel(member, start, end) {
  const result = {
    name: member.name,
    absences: {},
  }
  for (const { date, absence } of absences(member, start, end)) {
    if (!result.absences[date]) {
      result.absences[date] = []
    }
    result.absences[date].push(absence)
  }
  return result
}

const isAbsent = (_absences) => {
  if (_absences) {
    for (const absence of _absences) {
      if (absence.type === 'holiday' || absence.type === 'absence') {
        return true
      }
    }
  }
  return false
}

const absentMemberCount = (members, dates) => {
  let absent = 0

  for (const member of members) {
    for (const date of dates) {
      if (isAbsent(member.absences[date])) {
        absent += 1
      }
    }
  }

  return absent
}

export const timeRange = (sprint, currentDate) => {
  const _startOfWeek = currentDate.with(startOfWeek())
  const _endOfNextWeek = _startOfWeek.plusDays(13)

  // show at least the current sprint
  const isScrum = sprint.scrum
  const start = isScrum && _startOfWeek.compareTo(sprint.start) > 0
    ? sprint.start : _startOfWeek
  const end = isScrum && _endOfNextWeek.compareTo(sprint.end) < 0
    ? sprint.end : _endOfNextWeek
  return { start, end }
}

export default function teamModel(
  {
    name, status, startOfBusiness, endOfBusiness, sprint,
  },
  {
    start, end, members, currentDate, cacheTimestamp,
  },
) {
  const result = {
    name,
    status,
    cacheTimestamp,
    startOfBusiness,
    endOfBusiness,
    range: {
      currentDate: currentDate.toString(),
      start: start.toString(),
      end: end.toString(),
    },
    members,
  }

  if (sprint.scrum) {
    const sprintDates = Array.from(sprint.dates()).map(x => x.toString())
    const total = members.length * sprintDates.length
    const absent = absentMemberCount(members, sprintDates)
    const avail = total - absent
    result.range.sprint = {
      start: sprint.start.toString(),
      end: sprint.end.toString(),
    }
    result.sprint = {
      number: sprint.count + 1,
      start: sprint.start.toString(),
      end: sprint.end.toString(),
      summary: { total, avail },
    }
  }
  return result
}
