var item;
var item;
import Absence from './absence';

class Member {
    constructor(calendars, name) {
        this.calendars = calendars;
        this.name = name;
    }

    *events() {
        for (let i = 0; i < this.calendars.length; i++) {
            let item;
            let calendar = this.calendars[i];
            let iter = calendar.events();
            while (!(item = iter.next()).done) {
                let event = item.value;
                if (event.calendar.holidays) {
                    yield event;
                    continue;
                }

                let attendeeIterator = event.attendees();
                while (!(item = attendeeIterator.next()).done) {
                    let attendee = item.value;
                    if (attendee.cn() === this.name) {
                        yield event;
                        break;
                    }
                }
            }
        }
        return;
    }

    *absences(date) {
        return yield* Absence.fromEvents(this.events(), this, date);
    }

    *days(date) {
        let current = date.clone().startOf('day');
        let day = new Day(current);

        let absenceIterator = this.absences(date);
        while (!(item = absenceIterator.next()).done) {
            let absence = item.value;
            if (absence.date.isBefore(current, 'day')) { continue; }

            while (absence.date.isAfter(current, 'day')) {
                yield day;
                day = new Day(current.add(1, 'days'));
            }

            day.absences.push(absence);
        }

        return yield day;
    }

    dayArray(startDate, endDate) {
        let count = 1 + endDate.diff(startDate, 'days');
        let result = [];
        let dayIterator = this.days(startDate);
        while (!(item = dayIterator.next()).done) {
            if (item.value.date.isAfter(endDate)) { return result; }
            result.push(item.value);
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