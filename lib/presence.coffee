Promise = require 'bluebird'
Promise.longStackTraces()
moment = require 'moment'

inMemCache = {}

getAbsence = Promise.method (date) ->
    updateAbsence = require './updateAbsence'
    key = date.format 'YYYY-MM-DD'
    cacheEntry = inMemCache[key]
    now = moment()
    if cacheEntry.validUntil?
        unless cacheEntry.validUntil.isAfter now
            cacheEntry = inMemCache[key] =
                absence: updateAbsence date
                validUntil: now.add 60, 'seconds'

    cacheEntry.absence

module.exports = (date, cb) ->
    getAbsence(date).asCallback cb