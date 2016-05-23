import fs from 'fs'
import path from 'path'
import {expect} from 'chai'
import {Instant, LocalDate} from 'js-joda'
import {toLocalDate} from '../lib/util'

describe('ical', () => {
    const EVENT_COUNT = 1;
    const TEST_EVENT = 'Test';
    const TEST_DESCRIPTION = 'Test Description';
    const TEST_USER = 'Test User';

    let Calendar;
    let toMoment;

    before('import', () => {
        System.import('../lib/calendar').then((module) => Calendar = module.default);
        System.import('../lib/util').then((module) => toMoment = module.toMoment);
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
            expect(event, TEST_EVENT).to.exist;
        });

        describe(`Event '${TEST_EVENT}'`, () => {
            let confluenceType;
            let nextWeek;
            let christmas;
            let newYear;
            let endMoment;

            let TEST_DAY = LocalDate.parse('2015-10-29');

            let event = null;
            before('find', () => event = findEvent(TEST_EVENT));

            it(`should have Description of '${TEST_DESCRIPTION}'`, () =>
                expect(event.description()).to.equal(TEST_DESCRIPTION)
            );

            it(`should be in confluence subcalendar '${confluenceType = 'leaves'}'`, () =>
                expect(event.confluenceCalendarType()).to.equal(confluenceType)
            );

            it("should be recurring", () =>
                expect(event.icalEvent.isRecurring()).to.be.true
            );

            it(`should start on ${TEST_DAY}`, () => {
                let startDate = event.startDate();
                expect(startDate, 'startDate').to.exist;
                expect(TEST_DAY.equals(toLocalDate(startDate))).to.be.true;
            });

            let testMoment;
            it(`should start at ${testMoment = Instant.parse('2015-10-29T12:30:00Z')}`, () => {
                let startDate = event.startDate();
                expect(startDate.equals(testMoment)).to.be.true;
            });

            it(`first occurance should be on ${TEST_DAY}`, () => {
                for (let instance of event.instances()) {
                    let date = toLocalDate(instance.startDate());
                    expect(date.equals(TEST_DAY)).to.be.true;
                    return;
                }
                throw new Error("No instances");
            });

            it(`starting a week later, first occurance should be on ${nextWeek = TEST_DAY.plusWeeks(1)}`, () => {
                for (let instance of event.instances(nextWeek)) {
                    let date = toLocalDate(instance.startDate());
                    expect(date.equals(nextWeek)).to.be.true;
                    return;
                }
                throw new Error("No instances");
            });

            it(`first occurance should stay on ${TEST_DAY}, when iterating from a day before`, () => {
                for (let instance of event.instances(TEST_DAY.minusDays(1))) {
                    let date = toLocalDate(instance.startDate());
                    expect(date.equals(TEST_DAY), date.toString()).to.be.true;
                    return;
                }
                throw new Error("No instances");
            });

            it(`should be excluded between ${christmas = LocalDate.parse('2015-12-24')} and ${newYear = LocalDate.parse('2016-01-01')}`, () => {
                let beforeChristmas = christmas.minusDays(1);
                for (let instance of event.instances(beforeChristmas)) {
                    let date = toLocalDate(instance.startDate());
                    expect(newYear.compareTo(date), date.toString()).to.be.below(0);
                    return;
                }
                throw new Error("No instances");
            });

            it(`should end before ${endMoment = LocalDate.parse('2017-01-01')}`, () => {
                for (let instance of event.instances(endMoment)) {
                    let date = instance.startDate();
                    expect(instance, date.toString()).to.not.exist;
                }
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
                    expect(attendee.cn()).to.equal(cn);
                });

            testAttendee(`${TEST_USER}`);
            testAttendee(`${TEST_USER}1`);
            testAttendee(`${TEST_USER}2`);
        });
    });
});



