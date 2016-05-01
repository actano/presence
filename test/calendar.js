require('source-map-support').install();

import fs from 'fs'
import path from 'path'
import {expect} from 'chai'

describe('ical', function() {
    const EVENT_COUNT = 1;
    const TEST_EVENT = 'Test';
    const TEST_DESCRIPTION = 'Test Description';
    const TEST_USER = 'Test User';

    let Calendar;

    before('import', () => {
        return System.import('../lib/calendar').then((module) => Calendar = module.default);
    });

    function read() {
        let content = fs.readFileSync(path.join(__dirname, 'test.ics'), 'utf-8');
        return new Calendar(content);
    }

    it('should parse ics data', () => read());

    return describe('process', function() {
        let calendar = null;

        function findEvent(name) {
            for (const event of calendar.events()) {
                if (name === event.name()) { return event; }
            }
        }

        before('read', () => calendar = read());

        it(`should iterate ${EVENT_COUNT} events`, function() {
            let count = 0;
            for (const event of calendar.events()) count++
            return expect(count).to.equal(EVENT_COUNT);
        });

        it(`should find '${TEST_EVENT}'`, function() {
            let event = findEvent(TEST_EVENT);
            return expect(event, TEST_EVENT)
            .to.exist;
        });

        return describe(`Event '${TEST_EVENT}'`, function() {
            let confluenceType;
            let nextWeek;
            let christmas;
            let newYear;
            let endMoment;
            let moment = require('moment');

            function str(moment) {
                return moment ? moment.format('YYYY-MM-DD HH:mm') : 'null';
            }

            let TEST_MOMENT = moment('2015-10-29').startOf('day');

            let event = null;
            before('find', () => event = findEvent(TEST_EVENT));

            it(`should have Description of '${TEST_DESCRIPTION}'`, () =>
                expect(event.description())
                    .to.equal(TEST_DESCRIPTION)
            );

            it(`should be in confluence subcalendar '${confluenceType = 'leaves'}'`, () =>
                expect(event.confluenceCalendarType())
                    .to.equal(confluenceType)
            );

            it("should be recurring", () =>
                expect(event.icalEvent.isRecurring())
                    .to.be.true
            );

            it(`should start on ${str(TEST_MOMENT)}`, function() {
                let startDate = event.startDate();
                expect(startDate, 'startDate')
                .to.exist;

                return expect(startDate.isSame(TEST_MOMENT, 'day'))
                .to.be.true;
            });

            it(`first occurance should be on ${str(TEST_MOMENT)}`, function() {
                let instanceIterator = event.instances();
                let {date} = instanceIterator.next().value;
                return expect(date.isSame(TEST_MOMENT, 'day'))
                    .to.be.true;
            });

            it(`starting a week later, first occurance should be on ${str(nextWeek = moment(TEST_MOMENT).add(1, 'weeks'))}`, function() {
                let instanceIterator = event.instances(nextWeek);
                let {date} = instanceIterator.next().value;
                return expect(date.isSame(nextWeek, 'day'))
                    .to.be.true;
            });

            it(`first occurance should stay on ${str(TEST_MOMENT)}, when iterating from a day before`, function() {
                let instanceIterator = event.instances(moment(TEST_MOMENT).subtract(1, 'days'));
                let {date} = instanceIterator.next().value;
                return expect(date.isSame(TEST_MOMENT, 'day'), str(date))
                    .to.be.true;
            });

            it(`should be excluded between ${str(christmas = moment('2015-12-24'))} and ${str(newYear = moment('2016-01-01'))}`, function() {
                let beforeChristmas = christmas.subtract(1, 'days');
                let instanceIterator = event.instances(beforeChristmas);
                let {date} = instanceIterator.next().value;
                return expect(date.isBefore(newYear, 'day'), str(date))
                    .to.be.false;
            });

            it(`should end before ${str(endMoment = moment('2017-01-01'))}`, function() {
                let instanceIterator = event.instances(endMoment);
                let instance = instanceIterator.next().value;
                return expect(instance, (instance != null) ? str(instance.date) : null)
                    .to.not.exist;
            });

            let testAttendee = cn =>
                it(`should have ${cn} as attendee`, function() {
                    function find() {
                        for (const attendee of event.attendees()) {
                            if (attendee.cn() === cn) {
                                return attendee;
                            }
                        }
                    }
                    
                    const attendee = find();
                    expect(attendee).to.exist;
                    return expect(attendee.cn())
                        .to.equal(cn);
                })
            ;

            testAttendee(`${TEST_USER}`);
            testAttendee(`${TEST_USER}1`);
            return testAttendee(`${TEST_USER}2`);
        });
    });
});



