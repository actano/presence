let v;
import ICAL from 'ical.js';
import moment from 'moment';

let filterAfter = function*(start, iter) {
    let item;
    while (!(item = iter.next()).done) {
        let end = item.value.endDate();
        if (end.isAfter(start)) { yield item.value; }
    }
    return;
};

class Calendar {
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
            
        return;
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
    summary() { return this.icalEvent.summary.split(':')[1]; }
    name() { return this.icalEvent.summary.split(':')[0]; }
    description() { return this.icalEvent.description; }
    startDate() { if (this.icalEvent.startDate != null) { return moment(this.icalEvent.startDate.toJSDate()); } else { return null; } }
    endDate() { if (this.icalEvent.endDate != null) { return moment(this.icalEvent.endDate.toJSDate()); } else { return null; } }
    duration(unit) {
        return this.endDate().diff(this.startDate(), unit);
    }

    *instances(startTime) {
        if (startTime != null) {
            yield* filterAfter(startTime, this.instances());
            return;
        }

        if (!this.icalEvent.isRecurring()) {
            yield new Instance(this, this.startDate());
            return;
        }

        let iter = this.icalEvent.iterator();
        while ((v = iter.next()) != null) {
            let date = moment(v.toJSDate());
            yield new Instance(this, date);
        }
        return;
    }

    confluenceCalendarType() {
        return this.icalEvent.component.getFirstPropertyValue('x-confluence-subcalendar-type');
    }

    *attendees() {
        let { attendees } = this.icalEvent;
        for (let i = 0; i < attendees.length; i++) { let a = attendees[i];         yield new Attendee(a); }
        return;
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
        this.date = date;
        this.end = moment(this.date).add(this.event.duration('seconds'), 'seconds');
    }
    startDate() { return moment(this.date); }
    endDate() { return moment(this.end); }
    *days(start) {
        if (start != null) {
            return yield* filterAfter(start, this.days());
        }
        let startDate = this.date;
        let endDate = this.end;
        let next = moment(startDate).add(1, 'days').startOf('day');
        while (!startDate.isSame(endDate, 'days')) {
            yield new Day(startDate, moment(next));
            startDate = moment(next);
            next.add(1, 'days');
        }
        if (!startDate.isSame(endDate)) { yield new Day(startDate, endDate); }
        return;
    }
}

class Day {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    startDate() { return this.start; }
    endDate() { return this.end; }
}

export default Calendar;