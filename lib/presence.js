import { method } from 'bluebird'
import updateAbsence from './updateAbsence'

let inMemCache = {}

export default method(function (date) {
  let key = date.toString()
  let cacheEntry = inMemCache[key]
  let now = new Date().getTime()
  if (!cacheEntry || cacheEntry.validUntil < now) {
    cacheEntry = inMemCache[key] = {
      absence: updateAbsence(date),
      validUntil: now + 60000,
    }
  }

  return cacheEntry.absence
})
