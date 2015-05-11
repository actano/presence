Promise = require 'bluebird'
updateAbsence = require './updateAbsence'

absence = null
lastGet = null
updateInterval = 10 * 1000 # 10 seconds
lastDate = null

module.exports = Promise.coroutine (date) ->
    if date? isnt lastDate or new Date() - lastGet > updateInterval
        # update cached absence object if is older than the updateInterval
        absence = yield updateAbsence(date)
        lastGet = new Date()

    absence
