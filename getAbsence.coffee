Promise = require 'bluebird'
updateAbsence = require './updateAbsence'

absence = null
lastGet = null
updateInterval = 10 * 1000 # 10 seconds

module.exports = Promise.coroutine ->
  if new Date() - lastGet < updateInterval
    # return cached absence object if is younger than the updateInterval
    absence
  else
    absence = yield updateAbsence()
    lastGet = new Date()
    absence
