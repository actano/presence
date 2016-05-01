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

Absence.fromEvents = function*(eventIterator, member, start) {
    let iterators = [];
    for (let event of eventIterator) {
        let iterator = absences(event, member, start);
        iterator.last = iterator.next();
        iterators.push(iterator);
    }
    yield* merge(iterators);
};

function* absences(event, member, start) {
    for (let instance of event.instances(start)) {
        for (let day of instance.days(start)) {
            yield new Absence(member, instance.event, day);
        }
    }
}

function compareIterators(a, b) {
    if (a.last.done) { return -1; }
    if (b.last.done) { return 1; }
    return dateCompare(a.last.value.date, b.last.value.date);
}

function* merge(iterators) {
    iterators.sort(compareIterators);
    while (iterators.length) {
        let iterator = iterators[0];
        let {done, value} = iterator.last;
        if (done) {
            iterators.shift();
            continue;
        }
        yield value;
        iterator.last = iterator.next();
        iterators.sort(compareIterators);
    }
}

function dateCompare(a, b) {
    if (a.isBefore(b)) { return -1; }
    if (a.isAfter(b)) { return 1; }
    return 0;
}