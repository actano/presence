Promise = require 'bluebird'
moment = require 'moment'
getAbsence = require './getAbsence'

module.exports = Promise.coroutine (queryDate) ->
    teams = yield getAbsence queryDate

    data =
        today: queryDate
        moment: moment
        date: teams.date
        teams: teams
