import Member from './member';
import seedrandom from 'seedrandom'
import {LocalDate, LocalTime, ChronoField, ChronoUnit, DateTimeFormatter, DayOfWeek} from 'js-joda'
import {toLocalDate} from './util'

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
        let date = this.start;
        while (!date.isAfter(this.end)) {
            if (date.dayOfWeek() !== DayOfWeek.SUNDAY && date.dayOfWeek() !== DayOfWeek.SATURDAY) {
                yield date;
            }
            date = date.plusDays(1);
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
    if (!sprintConfig) return;
    let sprintStartDate = LocalDate.parse(sprintConfig.startDate);
    let weeksSinceSprintStart = sprintStartDate.until(date, ChronoUnit.WEEKS);
    if (weeksSinceSprintStart >= 0 && date.compareTo(sprintStartDate) >= 0) {
        let sprintsSinceFirstStart = Math.floor(weeksSinceSprintStart / sprintConfig.durationWeeks);
        let currentSprintStartDate = sprintStartDate.plusWeeks(sprintsSinceFirstStart * sprintConfig.durationWeeks);
        let currentSprintEndDate = currentSprintStartDate.plusWeeks(sprintConfig.durationWeeks).minusDays(1);
        return new Sprint(sprintsSinceFirstStart, currentSprintStartDate, currentSprintEndDate, sprintConfig.scrum);
    }
}

export default class Team {
    constructor(teamConfig, date, ...calendars) {
        this.calendars = calendars;
        this.name = teamConfig.name;
        let sob = LocalTime.parse(teamConfig.startOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME);
        let eob = LocalTime.parse(teamConfig.endOfBusiness, DateTimeFormatter.ISO_LOCAL_TIME);
        this.startOfBusiness = sob.get(ChronoField.MINUTE_OF_DAY);
        this.endOfBusiness = Math.max(this.startOfBusiness + 1, eob.get(ChronoField.MINUTE_OF_DAY));
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
                if ((absence != null) && absence.date.isSame(date, 'day')) continue;
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
            let member = this.members[i];
            for (let date of this.sprint.dates()) {
                for (let absence of member.absences(date, date.plusDays(1))) {
                    if (!toLocalDate(absence.date).equals(date)) continue;
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
