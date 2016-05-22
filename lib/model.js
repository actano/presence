import seedrandom from 'seedrandom'
import { LocalDate } from 'js-joda'
import { startOfWeek, toLocalDate } from './util'

export default function teamModel(team, currentDate) {
    let sprintStart = team.sprint.scrum ? toLocalDate(team.sprint.start) : null;
    let sprintEnd = team.sprint.scrum ? toLocalDate(team.sprint.end) : null;
    
    let result = {
        name: team.name,
        status: team.status,
        cacheTimestamp: team.cacheTimestamp,
        startOfBusiness: team.startOfBusiness,
        endOfBusiness: team.endOfBusiness,
        range: dateRange(team, currentDate, sprintStart, sprintEnd),
        members: []
    };
    for (let member of team.members) {
        result.members.push(memberModel(member, LocalDate.parse(result.range.start), LocalDate.parse(result.range.end)));
    }
    if (team.sprint.scrum) {
        let avail = [];
        let key = currentDate.toString();
        for (let member of result.members) {
            let absences = member.absences[key];
            if (!absences) {
                avail.push(member);
            }
        }
        if (avail.length) {
            let rng = seedrandom(key);
            avail[Math.floor(rng() * avail.length)].selected = true;
        }

        result.sprint = {
            number: team.sprint.count + 1,
            start: sprintStart.toString(),
            end: sprintEnd.toString(),
            summary: team.sprintSummary()
        }
    }
    return result;
}

function dateRange(team, currentDate, sprintStart, sprintEnd) {
    let sprint = sprintStart ? {start: sprintStart.toString(), end: sprintEnd.toString()} : null;

    // start at start of current week
    let start = currentDate.with(startOfWeek());
    // end at end of next week
    let end = start.plusDays(13);
    if (sprintStart) {
        // show at least the current sprint
        if (start.compareTo(sprintStart) > 0) start = sprintStart;
        if (end.compareTo(sprintEnd) < 0) end = sprintEnd;
    }

    return {
        currentDate: currentDate.toString(),
        start: start.toString(),
        end: end.toString(),
        sprint
    };
}

function memberModel(member, start = null, end = start) {
    let result = {
        name: member.name,
        absences: {}
    };
    if (start) {
        for (let absence of member.absences(start, end)) {
            let key = toLocalDate(absence.date).toString();
            let absences = result.absences[key];
            if (!absences) {
                result.absences[key] = absences = [];
            }
            absences.push(model(absence));
        }
    }
    return result;
}

function model(absence) {
    let zero = absence.date.clone().startOf('day');
    return {
        id: absence.event.icalEvent.uid,
        start: absence.date.diff(zero, 'minutes'),
        end: absence.day.endDate().diff(zero, 'minutes'),
        type: absence.isHoliday() ? 'holiday' : absence.isTravel() ? 'travel' : 'absence'
    }
}
