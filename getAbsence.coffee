Promise = require 'bluebird'
updateAbsence = require './updateAbsence'

absence = null
lastGet = null
updateInterval = 10 * 1000 # 10 seconds

module.exports = Promise.coroutine ->
    if new Date() - lastGet > updateInterval
        # update cached absence object if is older than the updateInterval
        absence = yield updateAbsence()
        lastGet = new Date()

    absence
