class Absence {
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
    let item;
    let iterators = [];
    while (!(item = eventIterator.next()).done) {
        let iterator = absences(item.value, member, start);
        iterator.last = iterator.next();
        iterators.push(iterator);
    }

    yield* merge(iterators);
    return;
};

const absences = function*(event, member, start) {
    let item;
    let instanceIterator = event.instances(start);
    while (!(item = instanceIterator.next()).done) {
        let instance = item.value;

        let dayIterator = instance.days(start);
        while (!(item = dayIterator.next()).done) {
            let day = item.value;
            yield new Absence(member, instance.event, day);
        }
    }
    return;
};

const compareIterators = function(a, b) {
    if (a.last.done) { return -1; }
    if (b.last.done) { return 1; }
    return dateCompare(a.last.value.date, b.last.value.date);
};

const merge = function*(iterators) {
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
    return;
};

const dateCompare = function(a, b) {
    if (a.isBefore(b)) { return -1; }
    if (a.isAfter(b)) { return 1; }
    return 0;
};

export default Absence;