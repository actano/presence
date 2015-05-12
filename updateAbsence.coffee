request = require 'request'
ICAL = require 'ical.js'
moment = require 'moment'
md5 = require 'MD5'
urlify = require('urlify').create
    addEToUmlauts: true
    szToSs: true
    spaces: "."
    nonPrintable: "_"
    trim: true

Promise = require 'bluebird'
Promise.promisifyAll request

# load team meta data
teams = require './teams'

EMAIL_SUFFIX = '@company.com'
GRAVATAR_PREFIX = 'http://www.gravatar.com/avatar/'
GRAVATAR_SUFFIX = '?s=32'

module.exports = Promise.coroutine (date) ->
    date = moment() if not moment(date).isValid()
    today = moment(date).hours(0).minutes 1
    tomorrow = today.add(1, 'days').subtract 2, 'minutes'

    for team in teams

        result =
            name: team.name
            absentees: []
            members: []
            date: today.format 'YYYY-MM-DD'

        # calculate and add gravatar-url to team members
        for member in team.members
            member_md5 = md5 urlify(member.toLowerCase()) + EMAIL_SUFFIX
            gravatar_url = "#{GRAVATAR_PREFIX}#{member_md5}#{GRAVATAR_SUFFIX}"
            result.members.push
                name: member
                image_url: gravatar_url

        # quick exit on weekends
        if today.day() is 0 or today.day() is 6
            for member in result.members
                result.absentees.push member.name

        else
            [response] = yield request.getAsync team.calender

            jCalData = ICAL.parse response.body
            comp = new ICAL.Component jCalData[1]

            # each logical item in the confluence calendar
            # is a 'vevent'; lookup all events of that type
            for event in comp.getAllSubcomponents 'vevent'
                # parse iCal event
                icalEvent = new ICAL.Event event

                # normalize title ('Who and Description are separated by :')
                icalEvent.summary = icalEvent.summary.split(':')[0]

                # map iCal dates to native dates
                start = moment icalEvent.startDate?.toJSDate()
                end = moment icalEvent.endDate?.toJSDate()

                # if both start and end are between yesterday
                # and tomorrow, add the person to absence list
                if start.isBefore(tomorrow) and end.isAfter(today)
                    result.absentees.push icalEvent.summary

                # handle recurring absence for part-time employees
                else if icalEvent.isRecurring() and
                        icalEvent.getRecurrenceTypes()?.WEEKLY and
                        start.day() is today.day()

                    isAbsent = true

                    # hand parse the exceptions and recurrence end date (until)
                    # see https://tools.ietf.org/html/rfc5545#section-3.8.5
                    icalEvent.component.jCal[1].map ([name, meta, type, value]) ->
                        if name is 'exdate' and moment(value).isSame today, 'day'
                            isAbsent = false

                        if name is 'rrule'
                            untilDateString = /UNTIL=(.*);/.exec(value)?[1]
                            if untilDateString and moment(untilDateString).isBefore today
                                isAbsent = false

                    result.absentees.push icalEvent.summary if isAbsent

        result
