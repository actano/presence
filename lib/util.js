import ICAL from 'ical.js';
import moment from 'moment'
import {LocalDate, DayOfWeek, TemporalAdjusters, ZonedDateTime, Instant, ZoneOffset} from 'js-joda'

export function toICalTime(localDate) {
    if (localDate instanceof LocalDate) return ICAL.Time.fromData({
        year: localDate.year(),
        month: localDate.month(),
        day: localDate.dayOfMonth(),
        isDate: true
    });
    throw new Error(`Unknown type: ${localDate.constructor.name}`);
}

export function toLocalDate(date) {
    if (date instanceof LocalDate) return date;
    if (moment.isMoment(date)) return LocalDate.parse(date.format('YYYY-MM-DD'));
    throw new Error(`Unknown type: ${date.constructor.name}`);
}

export function toMoment(date) {
    if (moment.isMoment(date)) return date;
    if (date instanceof Instant) {
        return moment(date.toEpochMilli()).locale('de_DE');        
    }
    throw new Error(`Unknown type: ${date.constructor.name}`);
}

export function toInstant(date) {
    if (date instanceof Instant) return date;
    if (date instanceof LocalDate) {
        date = moment(date.toString()).locale('de_DE');
    }
    if (moment.isMoment(date)) {
        return Instant.ofEpochMilli(date.valueOf());
    }
    throw new Error(`Unknown type: ${date.constructor.name}`);
}

export function firstDayOfWeek() {
    return DayOfWeek.of(((moment.localeData('de_DE').firstDayOfWeek() + 6) % 7) + 1);
}

export function startOfWeek() {
    return TemporalAdjusters.previousOrSame(firstDayOfWeek());
}

