import ICAL from 'ical.js';
import {Instant, LocalDate} from 'js-joda';
import {toInstant, toLocalDate} from './util';

function* filterAfter(start, iter) {
    for (let date of iter) {
        if (!date.endDate().isBefore(start)) {
            yield date;
        }
    }
}

function* icalIterator(icalObj) {
    let iterator = icalObj.iterator();
    let v = iterator.next();
    while (v != null) {
        yield v;
        v = iterator.next()
    }
}

export default class Calendar {
    constructor(content) {
        this.component = new ICAL.Component(ICAL.parse(content));
    }

    *events() {
        // each logical item in the confluence calendar
        // is a 'vevent'; lookup all events of that type
        let vevents = this.component.getAllSubcomponents('vevent');
        for (let i = 0; i < vevents.length; i++) {
            let event = vevents[i];
            yield new Event(this, new ICAL.Event(event));
        }
    }
}

function icalTimetoInstant(date) {
    if (date.isDate) {
        // TODO support LocalDate on caller site
        return toInstant(LocalDate.of(date.year, date.month, date.day));
    }
    // TODO this magically works, if confluence ICS and node are in the same timezone,
    // TODO since ICAL seems to neither detect localTimezone correct nor does it detect ICS timezone
    // TODO should use date.toUnixTime() if TZ detection works
    return Instant.ofEpochMilli(date.toJSDate().getTime());
}

class Event {
    constructor(calendar, icalEvent) {
        this.calendar = calendar;
        this.icalEvent = icalEvent;
    }

    isTravel() {
        return this.icalEvent.component.jCal[1].some(([name, meta, type, value]) => name === 'x-confluence-subcalendar-type' && value === 'travel');
    }

// name ('Who and Description are separated by :')
    summary() {
        return this.icalEvent.summary.split(':')[1];
    }

    name() {
        return this.icalEvent.summary.split(':')[0];
    }

    description() {
        return this.icalEvent.description;
    }

    startDate() {
        let date = this.icalEvent.startDate;
        if (date != null) {
            return icalTimetoInstant(date);
        } else {
            return null;
        }
    }

    duration() {
        return this.icalEvent.duration.toSeconds();
    }

    *instances(startTime, endTime) {
        if (endTime) {
            for (let instance of this.instances(startTime)) {
                if (!instance.startDate().isBefore(endTime)) break;
                yield instance;
            }
            return;
        }

        if (startTime != null) {
            if (!(startTime instanceof Instant)) {
                // TODO localDate support
                startTime = toInstant(startTime);
            }
            yield* filterAfter(startTime, this.instances());
            return;
        }

        if (!this.icalEvent.isRecurring()) {
            yield new Instance(this, this.startDate());
            return;
        }

        for (let v of icalIterator(this.icalEvent)) {
            let date = icalTimetoInstant(v);
            yield new Instance(this, date);
        }
    }

    confluenceCalendarType() {
        return this.icalEvent.component.getFirstPropertyValue('x-confluence-subcalendar-type');
    }

    *attendees() {
        let {attendees} = this.icalEvent;
        for (let attendee of attendees) {
            yield new Attendee(attendee);
        }
    }
}

class Attendee {
    constructor(property) {
        this.property = property;
    }

    cn() {
        return this.property.getParameter('cn');
    }
}

class Instance {
    constructor(event, date) {
        this.event = event;
        this._date = date;
        this._end = this._date.plusSeconds(this.event.duration());
    }

    startDate() {
        return this._date;
    }

    endDate() {
        return this._end;
    }

    *days(start) {
        if (start != null) {
            return yield* filterAfter(start, this.days());
        }
        let startDate = this.startDate();
        let endDate = this.endDate();
        let next = toLocalDate(startDate).plusDays(1);
        while (startDate.isBefore(endDate)) {
            let end = toInstant(next);
            if (endDate.compareTo(end) < 0) end = endDate;
            yield new Day(startDate, end);
            startDate = end;
            next = next.plusDays(1);
        }
    }
}

class Day {
    constructor(start, end) {
        this._start = start;
        this._end = end;
    }

    startDate() {
        return this._start;
    }

    endDate() {
        return this._end;
    }
}
