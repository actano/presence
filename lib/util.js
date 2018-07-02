import WeekData from 'cldr-core/supplemental/weekData.json'
import Cldr from 'cldrjs'
import {
  DayOfWeek,
  Instant,
  LocalDate,
  LocalTime,
  TemporalAdjusters,
  ZonedDateTime,
  ZoneId,
  ZoneOffset,
} from 'js-joda'
import { tz } from 'moment-timezone'

Cldr.load(WeekData)

const cldr2joda = (function cldr2joda() {
  const result = {}
  let i = 1
  while (true) {
    try {
      const dow = DayOfWeek.of(i)
      i += 1
      result[dow.toString().substring(0, 3).toLowerCase()] = dow
    } catch (e) {
      return result
    }
  }
}())

// modified bin-search, to always find existing indices for non-empty arrays
// value in array at index is larger than input value (or last index of array)
function search(array, value) {
  let hi = array.length - 1
  let lo = -1
  while (hi - lo > 1) {
    // eslint-disable-next-line no-bitwise
    const mid = hi + lo >> 1
    if (array[mid] <= value) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return hi
}

function toLocalUntils(v, i) {
  return v - (Math.min(this.offsets[i], this.offsets[Math.max(0, i - 1)]) * 60000)
}

class MomentZoneRules {
  constructor(timezone) {
    this.untils = timezone.untils
    /*
     localUntils is an array taken from original utc untils, modified by the reverse of the maximum
     (of actual, previous) offset thus, if you take the epochMillis of a LocalDateTime interpreted
     at UTC and binsearch it here, you should find the index of the transition, that is either
     unique or is before the transition in case of gap/overlap
     */
    this.localUntils = timezone.untils.map(toLocalUntils, timezone)
    this.offsets = timezone.offsets.map(v => ZoneOffset.ofTotalMinutes(-v))
  }

  // eslint-disable-next-line class-methods-use-this
  isFixedOffset() {
    return false
  }

  offset(instantOrLocalDateTime) {
    if (instantOrLocalDateTime instanceof Instant) {
      return this.offsetOfInstant(instantOrLocalDateTime)
    }
    return this.offsetOfLocalDateTime(instantOrLocalDateTime)
  }

  offsetOfInstant(instant) {
    return this._offset(this.untils, instant.toEpochMilli())
  }

  offsetOfLocalDateTime(localDateTime) {
    const localMillis = Instant.from(ZonedDateTime.of(localDateTime, ZoneId.UTC)).toEpochMilli()
    return this._offset(this.localUntils, localMillis)
  }

  _offset(array, timestamp) {
    let nextIndex = search(array, timestamp)
    if (nextIndex < 0) nextIndex = this.offsets.length - 1
    return this.offsets[nextIndex]
  }
}

class ZoneRegion extends ZoneId {
  constructor(id, rules) {
    super()
    this._id = id
    this._rules = rules
  }

  rules() {
    return this._rules
  }
}

class MomentZoneId extends ZoneRegion {
  constructor(id) {
    super(id, new MomentZoneRules(tz.zone(id)))
  }
}

const TZ = new MomentZoneId('Europe/Berlin')

export function toLocalDate(date) {
  if (date instanceof Instant) {
    return LocalDate.ofInstant(date, TZ)
  }
  throw new Error(`Unknown type: ${date.constructor.name}`)
}

export function toInstant(date) {
  if (date instanceof LocalDate) {
    return Instant.from(ZonedDateTime.of(date, LocalTime.MIDNIGHT, TZ))
  }
  throw new Error(`Unknown type: ${date.constructor.name}`)
}

function firstDayOfWeek() {
  const cldr = new Cldr('de-DE')
  return cldr2joda[cldr.supplemental.weekData.firstDay()]
}

export function startOfWeek() {
  return TemporalAdjusters.previousOrSame(firstDayOfWeek())
}

export function startOfDay(date) {
  return toInstant(toLocalDate(date))
}
