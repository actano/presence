moment = require 'moment'
Promise = require 'bluebird'
updateAbsence = require './updateAbsence'

inMemCache = {}

module.exports = Promise.method (date) ->
    key = date.format 'YYYY-MM-DD'
    cacheEntry = inMemCache[key]
    now = moment()
    unless cacheEntry?.validUntil?.isAfter now
        cacheEntry = inMemCache[key] =
            absence: updateAbsence date
            validUntil: now.add 60, 'seconds'

    cacheEntry.absence
