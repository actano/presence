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
GRAVATAR_SUFFIX = '?s=50'

getGravatarUrlFromName = (name) ->
    name_md5 = md5 urlify(name.toLowerCase()) + EMAIL_SUFFIX
    "#{GRAVATAR_PREFIX}#{name_md5}#{GRAVATAR_SUFFIX}"

module.exports = Promise.coroutine (date) ->
    date = moment() if not moment(date).isValid()
    today = moment(date).hours(0).minutes 1

    for team in teams

        result =
            name: team.name
            members: {}
            date: today.format 'YYYY-MM-DD'
            sprint: null

        # initalize sprint information
        if team.sprint
            sprintStartDate = moment team.sprint.startDate
            weeksSinceSprintStart = userDate.diff(sprintStartDate, 'weeks')
            if weeksSinceSprintStart > 0
                sprintsSinceFirstStart = Math.floor weeksSinceSprintStart / team.sprint.durationWeeks
                currentSprintStartDate = sprintStartDate.add sprintsSinceFirstStart * team.sprint.durationWeeks, 'weeks'
                currentSprintEndDate = moment(currentSprintStartDate).add(team.sprint.durationWeeks, 'weeks').subtract(1, 'days')
                result.sprint =
                    count: sprintsSinceFirstStart
                    start: currentSprintStartDate
                    end: currentSprintEndDate

        # init team-members with gravatar urls
        for member in team.members
            result.members[member] = {
                name: member
                image_url: getGravatarUrlFromName member
                status: null
                description: null
            }

        # quick exit on weekends
        if today.day() is 0 or today.day() is 6
            for member of result.members
                result.members[member].status = 'absent'

        else
            [response] = yield request.getAsync team.calendar

            jCalData = ICAL.parse response.body
            comp = new ICAL.Component jCalData[1]

            # each logical item in the confluence calendar
            # is a 'vevent'; lookup all events of that type
            for event in comp.getAllSubcomponents 'vevent'

                # parse iCal event
                icalEvent = new ICAL.Event event

                # init to defaults
                status = 'absent'
                isAbsent = false

                # switch to away (aka. home-office or business travel)
                icalEvent.component.jCal[1].map ([name, meta, type, value]) ->
                    if name is 'x-confluence-subcalendar-type' and value is 'travel'
                        status = 'away'

                # normalize title ('Who and Description are separated by :')
                icalEvent.summary = icalEvent.summary.split(':')[0]

                # map iCal dates to native dates
                start = moment icalEvent.startDate?.toJSDate()
                end = moment icalEvent.endDate?.toJSDate()

                # handle recurring absences
                if icalEvent.isRecurring() and
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

                # if start is today and duration less then seven hours, add the person to partial-absence list
                else if start.isSame(today, 'day') and end.diff(start) < (7 * 60 * 60 * 1000)
                    isAbsent = true
                    status = 'awayPartial'

                # if both start and end are between yesterday and tomorrow, add the person to absence list
                else if start.isBefore(moment(today).add(1, 'days').subtract(2, 'minutes')) and end.isAfter(today)
                    isAbsent = true

                if isAbsent
                    member = result.members[icalEvent.summary]
                    member.status = status
                    member.description = icalEvent.description


        result
