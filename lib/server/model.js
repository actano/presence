import { ChronoUnit } from 'js-joda'
import { LEAVES, HOLIDAY } from './eventType'
import { daysOf, filterAfter, instancesBetween } from './instances'
import { memberEvents } from './member'
import { sprintDates } from './team'
import { startOfDay, startOfWeek, toLocalDate } from './util'

function* absences(events, startDate, endDate) {
  for (const event of events) {
    for (const instance of instancesBetween(event, startDate, endDate)) {
      for (const day of filterAfter(startDate, daysOf(instance.startDate, instance.endDate))) {
        if (day.startDate.isAfter(endDate)) return
        const date = toLocalDate(day.startDate).toString()
        const zero = startOfDay(day.startDate)
        const absence = {
          id: instance.event.icalEvent.uid,
          start: zero.until(day.startDate, ChronoUnit.MINUTES),
          end: zero.until(day.endDate, ChronoUnit.MINUTES),
          type: instance.event.type,
        }
        yield { date, absence }
      }
    }
  }
}

export function memberModel(name, teamEvents, start, end) {
  const events = memberEvents(teamEvents, name)
  const result = {
    name,
    absences: {},
  }
  for (const { date, absence } of absences(events, start, end)) {
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
      if (absence.type === HOLIDAY || absence.type === LEAVES) {
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
