import { ChronoUnit } from 'js-joda'
import { daysOf, filterAfter, instancesBetween } from './instances'
import { sprintDates } from './team'
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

export const scrumTimeRange = (result, sprintConfig, currentDate) => {
  const { start: sprintStart, end: sprintEnd } = sprintDates(sprintConfig, currentDate) || {}
  if (!sprintStart) return result

  const start = result.start.compareTo(sprintStart) > 0
    ? sprintStart : result.start
  const end = result.end.compareTo(sprintEnd) < 0
    ? sprintEnd : result.end
  return { ...result, start, end }
}

export const timeRange = (currentDate) => {
  const _startOfWeek = currentDate.with(startOfWeek())
  const _endOfNextWeek = _startOfWeek.plusDays(13)
  return { start: _startOfWeek, end: _endOfNextWeek }
}

export function scrumTeamModel({
  start, end, dates, number, scrum,
} = {}, result) {
  if (!scrum) return result
  const { members } = result
  const total = members.length * dates.length
  const absent = absentMemberCount(members, dates)
  const avail = total - absent
  const sprint = {
    start, end, number, summary: { total, avail },
  }
  const range = {
    ...result.range,
    sprint,
  }
  return {
    ...result,
    range,
    sprint,
  }
}
