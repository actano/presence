import moment from 'moment'
import {LocalDate, DayOfWeek, TemporalAdjusters, Instant} from 'js-joda'

export function toLocalDate(date) {
    if (date instanceof Instant) {
        return LocalDate.parse(moment(date.toEpochMilli()).locale('de_DE').format('YYYY-MM-DD'));
    }
    throw new Error(`Unknown type: ${date.constructor.name}`);
}

export function toInstant(date) {
    if (date instanceof LocalDate) {
        return Instant.ofEpochMilli(moment(date.toString()).locale('de_DE').valueOf());
    }
    throw new Error(`Unknown type: ${date.constructor.name}`);
}

export function firstDayOfWeek() {
    return DayOfWeek.of(((moment.localeData('de_DE').firstDayOfWeek() + 6) % 7) + 1);
}

export function startOfWeek() {
    return TemporalAdjusters.previousOrSame(firstDayOfWeek());
}

export function startOfDay(date) {
    return toInstant(toLocalDate(date));
    
}
