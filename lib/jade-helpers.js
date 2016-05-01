let item;
import moment from 'moment';

class Helpers {
    constructor(today) {
        this.dayClass = this.dayClass.bind(this);
        this.statusClasses = this.statusClasses.bind(this);
        this.dateArray = this.dateArray.bind(this);
        this.startOfCalendar = this.startOfCalendar.bind(this);
        this.endOfCalendar = this.endOfCalendar.bind(this);
        this.today = today;
    }

    dayClass(team, date) {
        let result = [];
        if (date.isSame(this.today, 'day')) {
            result.push('today');
        }
        if (date.day() === 5) {
            result.push('preWeekend');
        }
        if (date.day() === 1) {
            result.push('postWeekend');
        }
        result.push(date.week() % 2 ? 'weekOdd' : 'weekEven');
        if (team.sprint.scrum) {
            let offSprint = date.isBefore(team.sprint.start, 'day') || date.isAfter(team.sprint.end, 'day');
            result.push(offSprint ? 'offSprint' : 'inSprint');
        }
        return result;
    }

    absenceClass(absence) {
        if (absence.isHoliday()) {
            return 'public-holiday';
        }
        if (absence.isTravel()) {
            return 'away';
        }
        return 'absent';
    }

    statusClasses(member, date, classes) {
        let result = Array.prototype.slice.call(arguments, 2);
        let absenceIterator = member.absences(date);
        while (!(item = absenceIterator.next()).done) {
            let absence = item.value;
            if (absence.date.isAfter(date, 'day')) { break; }
            result.push(this.absenceClass(absence));
        }
        return result;
    }

    dateArray(start, end) {
        let result = [];
        let date = start.clone().startOf('day');
        date.locale(this.today.locale());
        while (!date.isAfter(end, 'day')) {
            if (date.day() % 6 !== 0) {
                result.push(date);
            }
            date = date.clone().add(1, 'days');
        }
        return result;
    }

    absencePercentage(team, startDate, endDate) {
        let sob = team.startOfBusiness;
        let eob = team.endOfBusiness;
        let zero = startDate.clone().startOf('day').add(sob, 'minutes');
        eob -= sob;
        let start = Math.max(0, startDate.diff(zero, 'minutes'));
        let end = Math.min(eob, endDate.diff(zero, 'minutes'));
        return {
            start: start / eob,
            end: end / eob
        };
    }

    startOfCalendar(team, date) {
        let start = date.clone().locale(this.today.locale());
        if (start.weekday() !== 0) { start.weekday(-7); }
        return moment.max(start, team.sprint.start);
    }

    endOfCalendar(team, date) {
        let end = date.clone().add(1, 'weeks');
        end.locale(this.today.locale());
        if (end.weekday() !== 6) { end.weekday(6); }
        return moment.max(end, team.sprint.end);
    }
}

export default Helpers;
