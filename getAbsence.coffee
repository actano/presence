moment = require 'moment'
Promise = require 'bluebird'
updateAbsence = require './updateAbsence'

inMemCache = {} # {'YYYY-MM-DD': {absences: {}, lastGet: `timestamp`}}
updateInterval = 10 * 1000 # 10 seconds

module.exports = Promise.coroutine (date = moment().format 'YYYY-MM-DD') ->
    # update cached absence object for `date` if it is outdated
    lastGet = inMemCache[date]?.lastGet ? 0
    if new Date() - lastGet > updateInterval
        inMemCache[date] =
            absence: yield updateAbsence date
            lastGet: new Date()

    inMemCache[date].absence
