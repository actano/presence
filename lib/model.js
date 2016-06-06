import seedrandom from 'seedrandom'
import { LocalDate, ChronoUnit } from 'js-joda'
import { startOfWeek, startOfDay, toLocalDate, toInstant } from './util'

export default function teamModel(team, currentDate) {
  const sprintStart = team.sprint.scrum ? team.sprint.start : null
  const sprintEnd = team.sprint.scrum ? team.sprint.end : null

  const result = {
    name: team.name,
    status: team.status,
    cacheTimestamp: team.cacheTimestamp,
    startOfBusiness: team.startOfBusiness,
    endOfBusiness: team.endOfBusiness,
    range: dateRange(team, currentDate, sprintStart, sprintEnd),
    members: [],
  }
  for (const member of team.members) {
    const startInstant = toInstant(LocalDate.parse(result.range.start))
    const endInstant = toInstant(LocalDate.parse(result.range.end))
    result.members.push(memberModel(member, startInstant, endInstant))
  }
  if (team.sprint.scrum) {
    const avail = []
    const key = currentDate.toString()
    for (const member of result.members) {
      const absences = member.absences[key]
      if (!absences) {
        avail.push(member)
      }
    }
    if (avail.length) {
      const rng = seedrandom(key)
      avail[Math.floor(rng() * avail.length)].selected = true
    }

    result.sprint = {
      number: team.sprint.count + 1,
      start: sprintStart.toString(),
      end: sprintEnd.toString(),
      summary: team.sprintSummary(),
    }
  }
  return result
}

function dateRange(team, currentDate, sprintStart, sprintEnd) {
  const sprint = sprintStart ? { start: sprintStart.toString(), end: sprintEnd.toString() } : null

    // start at start of current week
  let start = currentDate.with(startOfWeek())
    // end at end of next week
  let end = start.plusDays(13)
  if (sprintStart) {
        // show at least the current sprint
    if (start.compareTo(sprintStart) > 0) start = sprintStart
    if (end.compareTo(sprintEnd) < 0) end = sprintEnd
  }

  return {
    currentDate: currentDate.toString(),
    start: start.toString(),
    end: end.toString(),
    sprint,
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
      let absences = result.absences[key]
      if (!absences) {
        absences = result.absences[key] = []
      }
      absences.push(model(absence))
    }
  }
  return result
}

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
