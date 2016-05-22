import moment from 'moment'
import {LocalDate} from 'js-joda'

export function toMoment(date) {
    if (moment.isMoment(date)) return date;
    if (date instanceof LocalDate) return moment(date.toString()).locale('de_DE');
    if (typeof date.toJSDate === 'function') return moment(date.toJSDate()).locale('de_DE');
    throw new Error(`Unknown type: ${typeof date}`);
}

