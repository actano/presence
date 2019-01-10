import updateAbsence from './updateAbsence'

const inMemCache = {}

export default (date) => {
  const key = date.toString()
  const now = new Date().getTime()
  if (!inMemCache[key] || inMemCache[key].validUntil < now) {
    inMemCache[key] = {
      absence: updateAbsence(date),
      validUntil: now + 60000,
    }
  }

  return inMemCache[key].absence
}
