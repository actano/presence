import { ChronoUnit } from 'js-joda'
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

function memberModel(member, start = null, end = start) {
  const result = {
    name: member.name,
    absences: {},
  }
  if (start) {
    for (const absence of member.absences(start, end)) {
      const key = toLocalDate(absence.startDate()).toString()
      if (!result.absences[key]) {
        result.absences[key] = []
      }
      result.absences[key].push(model(absence))
    }
  }
  return result
}

const absentMemberCount = (members, dates) => {
  let absent = 0

  for (const member of members) {
    for (const date of dates) {
      for (const absence of member.absences(toInstant(date), toInstant(date.plusDays(1)))) {
        if (toLocalDate(absence.startDate()).equals(date)) {
          if (absence.isHoliday() || absence.isAbsence()) {
            absent += 1
            break
          }
        }
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
    const sprintDates = Array.from(team.sprint.dates())
    const total = team.members.length * sprintDates.length
    const absent = absentMemberCount(team.members, sprintDates)
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
