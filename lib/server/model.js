import { ChronoUnit } from 'js-joda'
import { filterAfter} from './instances'
import { daysOf, instancesBetween } from './instances'
import { startOfDay, startOfWeek, toInstant, toLocalDate } from './util'

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

function memberModel(member, start, end) {
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
