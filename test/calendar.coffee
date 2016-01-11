describe 'ical', ->
    EVENT_COUNT = 1
    TEST_EVENT = 'Test'
    TEST_DESCRIPTION = 'Test Description'
    TEST_USER = 'Test User'

    {fs, path, Calendar, expect} = {}


    before 'require', ->
        fs = require 'fs'
        path = require 'path'
        {expect} = require 'chai'

        Calendar = require '../lib/calendar'

    read = ->
        content = fs.readFileSync path.join(__dirname, 'test.ics'), 'utf-8'
        new Calendar content

    it 'should parse ics data', ->
        read()

    describe 'process', ->
        calendar = null

        findEvent = (name) ->
            eventIterator = calendar.events()
            until (item = eventIterator.next()).done
                event = item.value
                return event if name is event.name()

        before 'read', -> calendar = read()

        it "should iterate #{EVENT_COUNT} events", ->
            eventIterator = calendar.events()
            count = 0
            until eventIterator.next().done
                count++
            expect count
                .to.equal EVENT_COUNT

        it "should find '#{TEST_EVENT}'", ->
            event = findEvent TEST_EVENT
            expect event, TEST_EVENT
            .to.exist

        describe "Event '#{TEST_EVENT}'", ->
            moment = require 'moment'
            str = (moment) -> if momemnt? then moment.format 'YYYY-MM-DD HH:mm' else 'null'

            TEST_MOMENT = moment '2015-10-29'
                .startOf 'day'

            event = null
            before 'find', ->
                event = findEvent TEST_EVENT

            it "should have Description of '#{TEST_DESCRIPTION}'", ->
                expect event.description()
                    .to.equal TEST_DESCRIPTION

            it "should be in confluence subcalendar '#{confluenceType = 'leaves'}'", ->
                expect event.confluenceCalendarType()
                    .to.equal confluenceType

            it "should be recurring", ->
                expect event.icalEvent.isRecurring()
                    .to.be.true

            it "should start on #{str TEST_MOMENT}", ->
                startDate = event.startDate()
                expect startDate, 'startDate'
                .to.exist

                expect startDate.isSame TEST_MOMENT, 'day'
                .to.be.true

            it "first occurance should be on #{str TEST_MOMENT}", ->
                instanceIterator = event.instances()
                {date} = instanceIterator.next().value
                expect date.isSame TEST_MOMENT, 'day'
                    .to.be.true

            it "starting a week later, first occurance should be on #{str nextWeek = moment(TEST_MOMENT).add 1, 'weeks'}", ->
                instanceIterator = event.instances nextWeek
                {date} = instanceIterator.next().value
                expect date.isSame nextWeek, 'day'
                    .to.be.true

            it "first occurance should stay on #{str TEST_MOMENT}, when iterating from a day before", ->
                instanceIterator = event.instances moment(TEST_MOMENT).subtract 1, 'days'
                {date} = instanceIterator.next().value
                expect date.isSame(TEST_MOMENT, 'day'), str date
                    .to.be.true

            it "should be excluded between #{str christmas = moment '2015-12-24'} and #{str newYear = moment '2016-01-01'}", ->
                beforeChristmas = christmas.subtract 1, 'days'
                instanceIterator = event.instances beforeChristmas
                {date} = instanceIterator.next().value
                expect date.isBefore(newYear, 'day'), str date
                    .to.be.false

            it "should end before #{str endMoment = moment '2017-01-01'}", ->
                instanceIterator = event.instances endMoment
                instance = instanceIterator.next().value
                expect instance, str instance?.date
                    .to.not.exist

            it "should have #{TEST_USER} as first attendee", ->
                attendeeIterator = event.attendees()
                attendee = attendeeIterator.next().value
                expect attendee
                    .to.exist
                expect attendee.cn()
                    .to.equal TEST_USER



