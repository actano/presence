import assert from 'assert'
import { Instant } from 'js-joda'
import { icalIterator, icalTimetoInstant } from './icalCompatibility'
import { toInstant, toLocalDate } from './util'

export function* filterAfter(start, iter) {
  for (const date of iter) {
    if (!date.endDate.isBefore(start)) {
      yield date
    }
  }
}

export function* daysOf(start, end) {
  let startDate = start
  let next = toLocalDate(startDate).plusDays(1)
  while (startDate.isBefore(end)) {
    let endDate = toInstant(next)
    if (end.compareTo(endDate) < 0) endDate = end
    yield { startDate, endDate }
    startDate = endDate
    next = next.plusDays(1)
  }
}

export function* instances(event) {
  const duration = event.icalEvent.duration.toSeconds()
  if (!event.icalEvent.isRecurring()) {
    const startDate = icalTimetoInstant(event.icalEvent.startDate)
    const endDate = startDate.plusSeconds(duration)
    yield { event, startDate, endDate }
    return
  }

  for (const v of icalIterator(event.icalEvent)) {
    const startDate = icalTimetoInstant(v)
    const endDate = startDate.plusSeconds(duration)
    yield { event, startDate, endDate }
  }
}

export function* instancesAfter(event, startTime) {
  assert(startTime instanceof Instant)
  yield* filterAfter(startTime, instances(event))
}

export function* instancesBetween(event, startTime, endTime) {
  assert(endTime instanceof Instant)
  for (const instance of instancesAfter(event, startTime)) {
    if (!instance.startDate.isBefore(endTime)) break
    yield instance
  }
}
