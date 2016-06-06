import { method } from 'bluebird'
import updateAbsence from './updateAbsence'

const inMemCache = {}

export default method((date) => {
  const key = date.toString()
  let cacheEntry = inMemCache[key]
  const now = new Date().getTime()
  if (!cacheEntry || cacheEntry.validUntil < now) {
    cacheEntry = inMemCache[key] = {
      absence: updateAbsence(date),
      validUntil: now + 60000,
    }
  }

  return cacheEntry.absence
})
