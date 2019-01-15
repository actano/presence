import { ChronoUnit } from 'js-joda'
import Absence from './absence'
import { startOfDay, startOfWeek, toInstant, toLocalDate } from './util'

function absenceType(absence) {
  if (absence.isHoliday()) return 'holiday'
  if (absence.isTravel()) return 'travel'
  return 'absence'
}

function model(absence) {
  const zero = startOfDay(absence.startDate())
  return {
    id: absence.event.icalEvent.uid,
    start: zero.until(absence.day.startDate(), ChronoUnit.MINUTES),
    end: zero.until(absence.day.endDate(), ChronoUnit.MINUTES),
    type: absenceType(absence),
  }
}

function* absences(member, startDate, endDate) {
  const _absences = Absence.fromEvents(member.events, this, startDate, endDate)
  if (!endDate) {
    yield* _absences
    return
  }
  for (const absence of _absences) {
    if (absence.startDate().isAfter(endDate)) break
    yield absence
  }
}

function memberModel(member, start = null, end = start) {
  const result = {
    name: member.name,
    absences: {},
  }
  if (start) {
    for (const absence of absences(member, start, end)) {
      const key = toLocalDate(absence.startDate()).toString()
      if (!result.absences[key]) {
        result.absences[key] = []
      }
      result.absences[key].push(model(absence))
    }
  }
  return result
}

const isAbsent = (member, date) => {
  const absences = member.absences[date]
  if (absences) {
    for (const absence of absences) {
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
      if (isAbsent(member, date)) {
        absent += 1
      }
    }
  }

  return absent
}


export default function teamModel(team, currentDate) {
  const _startOfWeek = currentDate.with(startOfWeek())
  const _endOfNextWeek = _startOfWeek.plusDays(13)

  // show at least the current sprint
  const isScrum = team.sprint.scrum
  const start = isScrum && _startOfWeek.compareTo(team.sprint.start) > 0
    ? team.sprint.start : _startOfWeek
  const end = isScrum && _endOfNextWeek.compareTo(team.sprint.end) < 0
    ? team.sprint.end : _endOfNextWeek

  const startInstant = toInstant(start)
  const endInstant = toInstant(end)
  const members = team.members.map(member => memberModel(member, startInstant, endInstant))

  const result = {
    name: team.name,
    status: team.status,
    cacheTimestamp: team.cacheTimestamp,
    startOfBusiness: team.startOfBusiness,
    endOfBusiness: team.endOfBusiness,
    range: {
      currentDate: currentDate.toString(),
      start: start.toString(),
      end: end.toString(),
    },
    members,
  }

  if (isScrum) {
    result.range.sprint = {
      start: team.sprint.start.toString(),
      end: team.sprint.end.toString(),
    }
    const sprintDates = Array.from(team.sprint.dates()).map(x => x.toString())
    const total = team.members.length * sprintDates.length
    const absent = absentMemberCount(members, sprintDates)
    const avail = total - absent
    result.sprint = {
      number: team.sprint.count + 1,
      start: team.sprint.start.toString(),
      end: team.sprint.end.toString(),
      summary: { total, avail },
    }
  }
  return result
}
