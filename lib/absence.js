import {toLocalDate} from './util';

export default class Absence {
    constructor(member, event, day) {
        this.member = member;
        this.event = event;
        this.day = day;
        this.date = day.startDate();
    }

    isHoliday() {
        return this.event.calendar.holidays;
    }

    isTravel() {
        return this.event.isTravel();
    }

    isAbsence() {
        return !(this.isHoliday() || this.isTravel());
    }
}

Absence.fromEvents = function*(eventIterator, member, start, end) {
    for (let event of eventIterator) {
        for (let instance of event.instances(start, end)) {
            for (let day of instance.days(start)) {
                if (toLocalDate(day.startDate()).isAfter(end)) break;
                yield new Absence(member, instance.event, day);
            }
        }
    }
};
