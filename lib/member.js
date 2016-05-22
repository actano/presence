import Absence from './absence';
import {toLocalDate} from './util';

export default class Member {
    constructor(calendars, name) {
        this.calendars = calendars;
        this.name = name;
    }

    *events() {
        for (let calendar of this.calendars) {
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

    *absences(startDate, endDate) {
        var absences = Absence.fromEvents(this.events(), this, startDate, endDate);
        if (!endDate) return yield* absences;
        for (let absence of absences) {
            if (toLocalDate(absence.date).isAfter(endDate)) break;
            yield absence;
        }
    }
}
