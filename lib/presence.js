import Promise from 'bluebird';
Promise.longStackTraces();
import moment from 'moment';
import updateAbsence from './updateAbsence'

let inMemCache = {};

let getAbsence = Promise.method(function(date) {
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