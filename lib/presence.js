import {method} from 'bluebird';
import moment from 'moment';
import updateAbsence from './updateAbsence'
import { toMoment } from './util.js'

let inMemCache = {};

let getAbsence = method(function(date) {
    date = toMoment(date);
    let key = date.format('YYYY-MM-DD');
    let cacheEntry = inMemCache[key];
    let now = moment();
    if (!cacheEntry || !cacheEntry.validUntil.isAfter(now)) {
        cacheEntry = inMemCache[key] = {
            absence: updateAbsence(date),
            validUntil: now.add(60, 'seconds')
        };
    }

    return cacheEntry.absence;
});

export default (date, cb) => getAbsence(date).asCallback(cb);
