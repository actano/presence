import path from 'path'
import { expect } from 'chai'
import { Instant, LocalDate } from 'js-joda'
import { LEAVES } from '../lib/server/eventType'
import { instances, instancesAfter } from '../lib/server/instances'
import { toInstant, toLocalDate } from '../lib/server/util'
import events, { icalFromURL } from '../lib/server/calendar'
import withConfluenceType from '../lib/server/confluence'

/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

describe('ical', () => {
  const EVENT_COUNT = 1
  const TEST_EVENT = 'Test'
  const TEST_USER = 'Test User'

  async function read() {
    const { component } = await icalFromURL(path.join(__dirname, 'test.ics'))

    return events(component).map(event => withConfluenceType(event))
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
      const eventName = event => event.icalEvent.summary.split(':')[0]
      for (const event of calendarEvents) {
        if (name === eventName(event)) {
          return event
        }
      }
      return null
    }

    it('should iterate events', () => {
      let count = 0
      for (const event of calendarEvents) if (event) count += 1
      expect(count).to.equal(EVENT_COUNT)
    })

    it('should find test event', () => {
      const event = findEvent(TEST_EVENT)
      expect(event, TEST_EVENT).to.exist
    })

    describe('Test Event', () => {
      const TEST_DAY = LocalDate.parse('2015-10-29')
      const testMoment = Instant.parse('2015-10-29T12:30:00Z')
      const nextWeek = TEST_DAY.plusWeeks(1)
      const christmas = LocalDate.parse('2015-12-24')
      const newYear = LocalDate.parse('2016-01-01')
      const endMoment = LocalDate.parse('2017-01-01')

      let event

      before(() => {
        event = findEvent(TEST_EVENT)
      })

      it('should detect confluence subcalendar', () => {
        expect(event.type).to.equal(LEAVES)
      })

      it('should be recurring', () => {
        expect(event.icalEvent.isRecurring()).to.be.true
      })

      it(`should start on ${TEST_DAY}`, () => {
        const { startDate } = event
        expect(startDate, 'startDate').to.exist
        expect(TEST_DAY.equals(toLocalDate(startDate))).to.be.true
      })

      it('should have correct startDate', () => {
        const { startDate } = event
        expect(startDate.equals(testMoment)).to.be.true
      })

      it('first occurance should be on correct day', () => {
        for (const instance of instances(event)) {
          const date = toLocalDate(instance.startDate)
          expect(date.equals(TEST_DAY)).to.be.true
          return
        }
        throw new Error('No instances')
      })

      it('starting a week later, first occurance should be on next week', () => {
        for (const instance of instancesAfter(event, toInstant(nextWeek))) {
          const date = toLocalDate(instance.startDate)
          expect(date.equals(nextWeek)).to.be.true
          return
        }
        throw new Error('No instances')
      })

      it('first occurance should stay on test day, when iterating from a day before', () => {
        for (const instance of instancesAfter(event, toInstant(TEST_DAY.minusDays(1)))) {
          const date = toLocalDate(instance.startDate)
          expect(date.equals(TEST_DAY), date.toString()).to.be.true
          return
        }
        throw new Error('No instances')
      })

      it('should be excluded between christmas and newYear', () => {
        const beforeChristmas = christmas.minusDays(1)
        for (const instance of instancesAfter(event, toInstant(beforeChristmas))) {
          const date = toLocalDate(instance.startDate)
          expect(newYear.compareTo(date), date.toString()).to.be.below(0)
          return
        }
        throw new Error('No instances')
      })

      it('should end before endMoment', () => {
        for (const instance of instancesAfter(event, toInstant(endMoment))) {
          const date = instance.startDate
          expect(instance, date.toString()).to.not.exist
        }
      })

      const testAttendee = cn =>
        it(`should have ${cn} as attendee`, () => {
          function find() {
            for (const attendee of event.attendees) {
              if (attendee === cn) {
                return attendee
              }
            }
            return null
          }

          const attendee = find()
          expect(attendee).to.exist
          expect(attendee).to.equal(cn)
        })

      testAttendee(`${TEST_USER}`)
      testAttendee(`${TEST_USER}1`)
      testAttendee(`${TEST_USER}2`)
    })
  })
})
