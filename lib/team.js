import moment from 'moment';
import Member from './member';
import seedrandom from 'seedrandom'

class Summary {
    constructor(avail, total) {
        this.avail = avail;
        this.total = total;
        this.percentage = 100 * this.avail / this.total;
    }
}

class Sprint {
    constructor(count, start, end, scrum) {
        this.count = count;
        this.start = start;
        this.end = end;
        this.scrum = scrum;
    }

    *dates() {
        let date = this.start.clone();
        while (!date.isAfter(this.end)) {
            if (date.day() !== 0 && date.day() !== 6) {
                yield date.clone();
            }
            date.add(1, 'days');
        }
    }
    datesCount() {
        let result = 0;
        let iter = this.dates();
        while (!iter.next().done) {
            result++;
        }
        return result;
    }
}

function initSprint(sprintConfig, date) {
    if (sprintConfig == null) { return; }
    let sprintStartDate = moment(sprintConfig.startDate);
    let weeksSinceSprintStart = date.diff(sprintStartDate, 'weeks');
    if (weeksSinceSprintStart >= 0 && (date.isAfter(sprintStartDate, 'day') || date.isSame(sprintStartDate, 'day'))) {
        let sprintsSinceFirstStart = Math.floor(weeksSinceSprintStart / sprintConfig.durationWeeks);
        let currentSprintStartDate = sprintStartDate.add(sprintsSinceFirstStart * sprintConfig.durationWeeks, 'weeks');
        let currentSprintEndDate = currentSprintStartDate.clone().add(sprintConfig.durationWeeks, 'weeks').subtract(1, 'days');
        return new Sprint(sprintsSinceFirstStart, currentSprintStartDate, currentSprintEndDate, sprintConfig.scrum);
    }
}

export default class Team {
    constructor(teamConfig, date, ...calendars) {
        this.calendars = calendars;
        this.name = teamConfig.name;
        let zero = moment();
        zero.startOf('day');
        let sob = moment(teamConfig.startOfBusiness, ['HH:mm:ss', 'HH:mm']);
        this.startOfBusiness = sob.diff(zero, 'minutes');
        let eob = moment(teamConfig.endOfBusiness, ['HH:mm:ss', 'HH:mm']);
        this.endOfBusiness = Math.max(this.startOfBusiness + 1, eob.diff(zero, 'minutes'));
        this.sprint = initSprint(teamConfig.sprint, date);
        this.status = null;
        this.members = [];
        for (let i = 0; i < teamConfig.members.length; i++) {
            let name = teamConfig.members[i];
            this.members.push(new Member(this.calendars, name));
        }
    }

    selectedMember(date) {
        if (this.sprint.scrum) {
            let avail = [];

            for (let i = 0; i < this.members.length; i++) {
                let member = this.members[i];
                let absence = member.absences(date).next().value;
                if ((absence != null) && absence.date.isSame(date, 'day')) { continue; }
                avail.push(member);
            }

            if (avail.length) {
                let rng = seedrandom(date.format('YYYY-MM-DD'));
                return avail[Math.floor(rng() * avail.length)];
            }
        }
    }

    sprintSummary() {
        let sprintDays = this.sprint.datesCount();
        let sprintMembers = this.members.length;
        let sprintMemberDays = sprintDays * sprintMembers;
        let sprintMemberAvailabilities = Number(sprintMemberDays);

        for (let i = 0; i < this.members.length; i++) {
            let item;
            let member = this.members[i];
            let iter = this.sprint.dates();
            while (!(item = iter.next()).done) {
                let date = item.value;
                let absenceIterator = member.absences(date);
                while (!(item = absenceIterator.next()).done) {
                    let absence = item.value;
                    if (!absence.date.isSame(date, 'day')) { break; }
                    if (absence.isHoliday() || absence.isAbsence()) {
                        sprintMemberAvailabilities--;
                        break;
                    }
                }
            }
        }

        return new Summary(sprintMemberAvailabilities, sprintMemberDays);
    }
}