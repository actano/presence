import ICAL from 'ical.js';
import moment from 'moment';
import {Instant, LocalDate} from 'js-joda';
import {toInstant, toMoment} from './util';

function* filterAfter(start, iter) {
    start = toInstant(start);
    for (let date of iter) {
        if (!toInstant(date.endDate()).isBefore(start)) {
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
            let result;
            if (date.isDate) {
                result = LocalDate.of(date.year, date.month, date.day);
            } else {
                // TODO this magically works, if confluence ICS and node are in the same timezone, 
                // TODO since ICAL seems to neither detect localTimezone correct nor does it detect ICS timezone
                // TODO should use date.toUnixTime() if TZ detection works
                result = Instant.ofEpochMilli(date.toJSDate().getTime());
            }
            return toInstant(result);
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
            yield* filterAfter(toInstant(startTime), this.instances());
            return;
        }

        if (!this.icalEvent.isRecurring()) {
            yield new Instance(this, toMoment(this.startDate()));
            return;
        }

        for (let v of icalIterator(this.icalEvent)) {
            let date = moment(v.toJSDate());
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
        this._date = toInstant(date);
        this._end = this._date.plusSeconds(this.event.duration());
    }

    startDate() {
        return this._date;
    }

    endDate() {
        return toMoment(this._end);
    }

    *days(start) {
        if (start != null) {
            return yield* filterAfter(toInstant(start), this.days());
        }
        let startDate = toMoment(this.startDate());
        let endDate = this.endDate();
        let next = moment(startDate).add(1, 'days').startOf('day');
        while (!startDate.isSame(endDate, 'days')) {
            yield new Day(startDate, moment(next));
            startDate = moment(next);
            next.add(1, 'days');
        }
        if (!startDate.isSame(endDate)) {
            yield new Day(startDate, endDate);
        }
    }
}

class Day {
    constructor(start, end) {
        this._start = toInstant(start);
        this._end = toInstant(end);
    }

    startDate() {
        return this._start;
    }

    endDate() {
        return toMoment(this._end);
    }
}
