import seedrandom from 'seedrandom'
import moment from 'moment'

export default function teamModel(team, currentDate) {
    let result = {
        name: team.name,
        status: team.status,
        cacheTimestamp: team.cacheTimestamp,
        startOfBusiness: team.startOfBusiness,
        endOfBusiness: team.endOfBusiness,
        range: dateRange(team, currentDate),
        members: []
    };
    for (let member of team.members) {
        result.members.push(memberModel(member, result.range.start, result.range.end));
    }
    if (team.sprint.scrum) {
        let avail = [];
        let key = dateKey(currentDate);
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
            start: team.sprint.start,
            end: team.sprint.end,
            summary: team.sprintSummary()
        }
    }
    return result;
}

function dateRange(team, currentDate) {
    let sprint = team.sprint.scrum ? {start: team.sprint.start, end: team.sprint.end} : null;

    // start at start of current week
    let start = currentDate.clone().weekday(0);
    // end at end of next week
    let end = start.clone().add('day', 13);
    if (sprint) {
        // show at least the current sprint
        start = moment.min(start, sprint.start);
        end = moment.max(end, sprint.end);
    }

    return {
        currentDate,
        start,
        end,
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
            let key = dateKey(absence.date);
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

function dateKey(date) {
    return date.format('YYYY-MM-DD');
}

