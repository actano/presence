import Absence from './absence';

class Member {
    constructor(calendars, name) {
        this.calendars = calendars;
        this.name = name;
    }

    *events() {
        for (let i = 0; i < this.calendars.length; i++) {
            let calendar = this.calendars[i];
            for (let event of calendar.events()) {
                if (event.calendar.holidays) {
                    yield event;
                    continue;
                }

                for (let attendee of event.attendees()) {
                    if (attendee.cn() === this.name) {
                        yield event;
                        break;
                    }
                }
            }
        }
    }

    *absences(date) {
        return yield* Absence.fromEvents(this.events(), this, date);
    }

    *days(date) {
        let current = date.clone().startOf('day');
        let day = new Day(current);

        for (let absence of this.absences(date)) {
            if (absence.date.isBefore(current, 'day')) continue;

            while (absence.date.isAfter(current, 'day')) {
                yield day;
                day = new Day(current.add(1, 'days'));
            }

            day.absences.push(absence);
        }

        yield day;
    }

    dayArray(startDate, endDate) {
        let count = 1 + endDate.diff(startDate, 'days');
        let result = [];
        for (let day of this.days(startDate)) {
            if (day.date.isAfter(endDate)) return result;
            result.push(day);
        }
        while (result.length < count) {
            result.push(new Day(startDate.clone().add(result.length, 'days')));
        }
        return result;
    }
}

class Day {
    constructor(date) {
        this.date = date.clone();
        this.absences = [];
    }

    isWeekend() {
        return this.date.day() === 0 || this.date.day() === 6;
    }
}

export default Member;