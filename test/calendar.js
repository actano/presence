import fs from 'fs'
import path from 'path'
import {expect} from 'chai'
import moment from 'moment'
import ICAL from 'ical.js'

describe('ical', () => {
    const EVENT_COUNT = 1;
    const TEST_EVENT = 'Test';
    const TEST_DESCRIPTION = 'Test Description';
    const TEST_USER = 'Test User';

    let Calendar;

    before('import', () => {
        System.import('../lib/calendar').then((module) => Calendar = module.default);
    });

    function read() {
        let content = fs.readFileSync(path.join(__dirname, 'test.ics'), 'utf-8');
        return new Calendar(content);
    }

    it('should parse ics data', () => read());

    describe('process', () => {
        let calendar = null;

        function findEvent(name) {
            for (const event of calendar.events()) {
                if (name === event.name()) {
                    return event;
                }
            }
        }

        before('read', () => calendar = read());

        it(`should iterate ${EVENT_COUNT} events`, () => {
            let count = 0;
            for (const event of calendar.events()) count++
            expect(count).to.equal(EVENT_COUNT);
        });

        it(`should find '${TEST_EVENT}'`, () => {
            let event = findEvent(TEST_EVENT);
            expect(event, TEST_EVENT)
                .to.exist;
        });

        describe(`Event '${TEST_EVENT}'`, () => {
            let confluenceType;
            let nextWeek;
            let christmas;
            let newYear;
            let endMoment;

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

            it(`should start on ${str(TEST_MOMENT)}`, () => {
                let startDate = event.startDate();
                expect(startDate, 'startDate')
                    .to.exist;

                expect(startDate.isSame(TEST_MOMENT, 'day'))
                    .to.be.true;
            });

            it(`first occurance should be on ${str(TEST_MOMENT)}`, () => {
                let instanceIterator = event.instances();
                let {date} = instanceIterator.next().value;
                expect(date.isSame(TEST_MOMENT, 'day'))
                    .to.be.true;
            });

            it(`starting a week later, first occurance should be on ${str(nextWeek = moment(TEST_MOMENT).add(1, 'weeks'))}`, () => {
                let instanceIterator = event.instances(nextWeek);
                let {date} = instanceIterator.next().value;
                expect(date.isSame(nextWeek, 'day'))
                    .to.be.true;
            });

            it(`first occurance should stay on ${str(TEST_MOMENT)}, when iterating from a day before`, () => {
                let instanceIterator = event.instances(moment(TEST_MOMENT).subtract(1, 'days'));
                let {date} = instanceIterator.next().value;
                expect(date.isSame(TEST_MOMENT, 'day'), str(date))
                    .to.be.true;
            });

            it(`should be excluded between ${str(christmas = moment('2015-12-24'))} and ${str(newYear = moment('2016-01-01'))}`, () => {
                let beforeChristmas = christmas.subtract(1, 'days');
                let instanceIterator = event.instances(beforeChristmas);
                let {date} = instanceIterator.next().value;
                expect(date.isBefore(newYear, 'day'), str(date))
                    .to.be.false;
            });

            it(`should end before ${str(endMoment = moment('2017-01-01'))}`, () => {
                let instanceIterator = event.instances(endMoment);
                let instance = instanceIterator.next().value;
                expect(instance, (instance != null) ? str(instance.date) : null)
                    .to.not.exist;
            });

            let testAttendee = cn =>
                it(`should have ${cn} as attendee`, () => {
                    function find() {
                        for (const attendee of event.attendees()) {
                            if (attendee.cn() === cn) {
                                return attendee;
                            }
                        }
                    }

                    let attendee = find();
                    expect(attendee).to.exist;
                    expect(attendee.cn())
                        .to.equal(cn);
                });

            testAttendee(`${TEST_USER}`);
            testAttendee(`${TEST_USER}1`);
            testAttendee(`${TEST_USER}2`);
        });

        describe(`Momentless Event '${TEST_EVENT}'`, () => {
            let confluenceType;
            let nextWeek;
            let christmas;
            let newYear;
            let endMoment;

            function str(time) {
                return String(time);
            }

            let TEST_DATE = ICAL.Time.fromDateString('2015-10-29');

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

            it(`should start on ${TEST_DATE}`, () => {
                let startDate = event.icalStartDate();
                expect(startDate, 'startDate')
                    .to.exist;

                expect(startDate.compareDateOnlyTz(TEST_DATE, startDate.zone))
                    .to.equal(0);
            });

            it(`first occurance should be on ${TEST_DATE}`, () => {
                let instanceIterator = event.icalInstances();
                let {date} = instanceIterator.next().value;
                expect(date.compareDateOnlyTz(TEST_DATE, date.zone))
                    .to.equal(0);
            });

            it(`starting a week later, first occurance should be on ${nextWeek = TEST_DATE.clone().adjust(7, 0, 0, 0, 0)}`, () => {
                let instanceIterator = event.icalInstances(nextWeek);
                let {date} = instanceIterator.next().value;
                expect(date.compareDateOnlyTz(nextWeek, date.zone), `${date} != ${nextWeek}`)
                    .to.equal(0);
            });

            it(`first occurance should stay on ${TEST_DATE}, when iterating from a day before`, () => {
                let instanceIterator = event.icalInstances(TEST_DATE.clone().adjust(-1, 0, 0, 0, 0));
                let {date} = instanceIterator.next().value;
                expect(date.compareDateOnlyTz(TEST_DATE, date.zone), str(date))
                    .to.equal(0);
            });

            it(`should be excluded between ${christmas = ICAL.Time.fromDateString('2015-12-24')} and ${newYear = ICAL.Time.fromDateString('2016-01-01')}`, () => {
                let beforeChristmas = christmas.adjust(-1);
                let instanceIterator = event.icalInstances(beforeChristmas);
                let {date} = instanceIterator.next().value;
                expect(date.compare(newYear), str(date))
                    .to.equal(1);
            });

            it(`should end before ${endMoment = ICAL.Time.fromDateString('2017-01-01')}`, () => {
                let instanceIterator = event.icalInstances(endMoment);
                let instance = instanceIterator.next().value;
                expect(instance, (instance != null) ? str(instance.date) : null)
                    .to.not.exist;
            });

            let testAttendee = cn =>
                it(`should have ${cn} as attendee`, () => {
                    function find() {
                        for (const attendee of event.attendees()) {
                            if (attendee.cn() === cn) {
                                return attendee;
                            }
                        }
                    }

                    let attendee = find();
                    expect(attendee).to.exist;
                    expect(attendee.cn())
                        .to.equal(cn);
                });

            testAttendee(`${TEST_USER}`);
            testAttendee(`${TEST_USER}1`);
            testAttendee(`${TEST_USER}2`);
        });
    });
});



