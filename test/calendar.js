import path from 'path'
import { expect } from 'chai'
import { Instant, LocalDate } from 'js-joda'
import icsFromURL from '../lib/server/ics-from-url'
import { instances, instancesAfter } from '../lib/server/instances'
import { toLocalDate } from '../lib/server/util'
import events from '../lib/server/calendar'

/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

describe('ical', () => {
  const EVENT_COUNT = 1
  const TEST_EVENT = 'Test'
  const TEST_DESCRIPTION = 'Test Description'
  const TEST_USER = 'Test User'

  async function read() {
    const { component } = await icsFromURL(path.join(__dirname, 'test.ics'))

    return events(component)
  }

  it('should parse ics data', async () => {
    await read()
  })

  describe('process', () => {
    let calendarEvents

    before('read', async () => {
      calendarEvents = await read()
    })

    function findEvent(name) {
      for (const event of calendarEvents) {
        if (name === event.name()) {
          return event
        }
      }
      return null
    }

    it(`should iterate ${EVENT_COUNT} events`, () => {
      let count = 0
      for (const event of calendarEvents) if (event) count += 1
      expect(count).to.equal(EVENT_COUNT)
    })

    it(`should find '${TEST_EVENT}'`, () => {
      const event = findEvent(TEST_EVENT)
      expect(event, TEST_EVENT).to.exist
    })

    describe(`Event '${TEST_EVENT}'`, () => {
      const TEST_DAY = LocalDate.parse('2015-10-29')

      let event = null
      before('find', () => {
        event = findEvent(TEST_EVENT)
      })

      it(`should have Description of '${TEST_DESCRIPTION}'`, () =>
        expect(event.description()).to.equal(TEST_DESCRIPTION))

      const confluenceType = 'leaves'
      it(`should be in confluence subcalendar '${confluenceType}'`, () =>
        expect(event.confluenceCalendarType()).to.equal(confluenceType))

      it('should be recurring', () =>
        expect(event.icalEvent.isRecurring()).to.be.true)

      it(`should start on ${TEST_DAY}`, () => {
        const startDate = event.startDate
        expect(startDate, 'startDate').to.exist
        expect(TEST_DAY.equals(toLocalDate(startDate))).to.be.true
      })

      let testMoment
      it(`should start at ${testMoment = Instant.parse('2015-10-29T12:30:00Z')}`, () => {
        const startDate = event.startDate
        expect(startDate.equals(testMoment)).to.be.true
      })

      it(`first occurance should be on ${TEST_DAY}`, () => {
        for (const instance of instances(event)) {
          const date = toLocalDate(instance.startDate)
          expect(date.equals(TEST_DAY)).to.be.true
          return
        }
        throw new Error('No instances')
      })

      const nextWeek = TEST_DAY.plusWeeks(1)
      it(`starting a week later, first occurance should be on ${nextWeek}`, () => {
        for (const instance of instancesAfter(event, nextWeek)) {
          const date = toLocalDate(instance.startDate)
          expect(date.equals(nextWeek)).to.be.true
          return
        }
        throw new Error('No instances')
      })

      it(`first occurance should stay on ${TEST_DAY}, when iterating from a day before`, () => {
        for (const instance of instancesAfter(event, TEST_DAY.minusDays(1))) {
          const date = toLocalDate(instance.startDate)
          expect(date.equals(TEST_DAY), date.toString()).to.be.true
          return
        }
        throw new Error('No instances')
      })

      const christmas = LocalDate.parse('2015-12-24')
      const newYear = LocalDate.parse('2016-01-01')
      it(`should be excluded between ${christmas} and ${newYear}`, () => {
        const beforeChristmas = christmas.minusDays(1)
        for (const instance of instancesAfter(event, beforeChristmas)) {
          const date = toLocalDate(instance.startDate)
          expect(newYear.compareTo(date), date.toString()).to.be.below(0)
          return
        }
        throw new Error('No instances')
      })

      const endMoment = LocalDate.parse('2017-01-01')
      it(`should end before ${endMoment}`, () => {
        for (const instance of instancesAfter(event, endMoment)) {
          const date = instance.startDate
          expect(instance, date.toString()).to.not.exist
        }
      })

      const testAttendee = cn =>
        it(`should have ${cn} as attendee`, () => {
          function find() {
            for (const attendee of event.attendees()) {
              if (attendee.cn() === cn) {
                return attendee
              }
            }
            return null
          }

          const attendee = find()
          expect(attendee).to.exist
          expect(attendee.cn()).to.equal(cn)
        })

      testAttendee(`${TEST_USER}`)
      testAttendee(`${TEST_USER}1`)
      testAttendee(`${TEST_USER}2`)
    })
  })
})
