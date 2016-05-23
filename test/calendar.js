import fs from 'fs'
import path from 'path'
import {expect} from 'chai'
import moment from 'moment'

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

            function str(moment) {
                return moment ? moment.format('YYYY-MM-DD HH:mm') : 'null';
            }

            function day(moment) {
                return moment ? moment.format('YYYY-MM-DD') : 'null';
            }

            let TEST_MOMENT = moment('2015-10-29').startOf('day');

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

            it(`should start on ${day(TEST_MOMENT)}`, () => {
                let startDate = toMoment(event.startDate());
                expect(startDate, 'startDate').to.exist;
                expect(startDate.isSame(TEST_MOMENT, 'day')).to.be.true;
            });

            let testMoment;
            it(`should start at ${str(testMoment = moment('2015-10-29T13:30').locale('de_DE'))}`, () => {
                let startDate = toMoment(event.startDate());
                expect(startDate, 'startDate').to.exist;
                expect(startDate.isSame(testMoment, 'minute')).to.be.true;
            });

            it(`first occurance should be on ${str(TEST_MOMENT)}`, () => {
                for (let instance of event.instances()) {
                    let date = toMoment(instance.startDate());
                    expect(date.isSame(TEST_MOMENT, 'day')).to.be.true;
                    return;
                }
                throw new Error("No instances");
            });

            it(`starting a week later, first occurance should be on ${str(nextWeek = moment(TEST_MOMENT).add(1, 'weeks'))}`, () => {
                for (let instance of event.instances(nextWeek)) {
                    let date = toMoment(instance.startDate());
                    expect(date.isSame(nextWeek, 'day')).to.be.true;
                    return;
                }
                throw new Error("No instances");
            });

            it(`first occurance should stay on ${str(TEST_MOMENT)}, when iterating from a day before`, () => {
                for (let instance of event.instances(moment(TEST_MOMENT).subtract(1, 'days'))) {
                    let date = toMoment(instance.startDate());
                    expect(date.isSame(TEST_MOMENT, 'day'), str(date)).to.be.true;
                    return;
                }
                throw new Error("No instances");
            });

            it(`should be excluded between ${str(christmas = moment('2015-12-24'))} and ${str(newYear = moment('2016-01-01'))}`, () => {
                let beforeChristmas = christmas.subtract(1, 'days');
                for (let instance of event.instances(beforeChristmas)) {
                    let date = toMoment(instance.startDate());
                    expect(date.isBefore(newYear, 'day'), str(date)).to.be.false;
                    return;
                }
                throw new Error("No instances");
            });

            it(`should end before ${str(endMoment = moment('2017-01-01'))}`, () => {
                for (let instance of event.instances(endMoment)) {
                    let date = toMoment(instance.startDate());
                    expect(instance, str(date)).to.not.exist;
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



