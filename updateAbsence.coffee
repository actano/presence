request = require 'request'
fs = require 'fs'
path = require 'path'
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
    userDate = moment(date)

    # skip weekends
    while userDate.day() is 0 or userDate.day() is 6
        userDate.add(1, 'days')

    for team in teams

        result =
            name: team.name
            members: {}
            date: userDate.format 'YYYY-MM-DD'
            sprint: null
            queryDates: [userDate]
            status: null

        # initalize sprint information
        if team.sprint
            sprintStartDate = moment team.sprint.startDate
            weeksSinceSprintStart = userDate.diff(sprintStartDate, 'weeks')
            if weeksSinceSprintStart > 0
                sprintsSinceFirstStart = Math.floor weeksSinceSprintStart / team.sprint.durationWeeks
                currentSprintStartDate = sprintStartDate.add(sprintsSinceFirstStart * team.sprint.durationWeeks, 'weeks')
                currentSprintEndDate = moment(currentSprintStartDate).add(team.sprint.durationWeeks, 'weeks').subtract(1, 'days')
                result.sprint =
                    count: sprintsSinceFirstStart
                    start: currentSprintStartDate
                    end: currentSprintEndDate


                result.queryDates = []
                queryDate = moment(result.sprint.start)
                while not queryDate.isAfter(result.sprint.end)
                    result.queryDates.push(moment(queryDate)) unless queryDate.day() is 0 or queryDate.day() is 6
                    queryDate.add(1, 'days')

        # init team-members with gravatar urls
        for member in team.members
            result.members[member] = {
                name: member
                image_url: getGravatarUrlFromName member
                absences:
                    count: 0
            }

        [response] = yield request.getAsync team.calendar

        responseBody = null
        icsFileName = path.join(__dirname, 'cache', "#{result.name}.ics")

        if response.statusCode >= 400
            result.status = "#{response.statusCode} - #{response.statusMessage}"

            # read ics from file for recovery
            responseBody = fs.readFileSync icsFileName, {encoding: 'utf-8'}

        else
            responseBody = response.body

            # write ics to file for recovery
            fs.writeFile icsFileName, responseBody, (err) ->
                if err
                    throw err
                console.info 'It\'s saved!'

        jCalData = ICAL.parse responseBody
        comp = new ICAL.Component jCalData[1]


        #iterate over the dates (in the sprint or today)
        for queryDate in result.queryDates

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

                # normalize name ('Who and Description are separated by :')
                name = icalEvent.summary.split(':')[0]

                # map iCal dates to native dates
                start = moment icalEvent.startDate?.toJSDate()
                end = moment icalEvent.endDate?.toJSDate()

                # handle recurring absences
                if icalEvent.isRecurring() and
                        icalEvent.getRecurrenceTypes()?.WEEKLY and
                        start.day() is queryDate.day() and
                        (start.isBefore(queryDate, 'day') or start.isSame(queryDate, 'day'))

                    isAbsent = true

                    # hand parse the exceptions and recurrence end date (until)
                    # see https://tools.ietf.org/html/rfc5545#section-3.8.5
                    icalEvent.component.jCal[1].map ([name, meta, type, value]) ->
                        if name is 'exdate' and moment(value).isSame queryDate, 'day'
                            isAbsent = false

                        if name is 'rrule'
                            untilDateString = /UNTIL=(.*);/.exec(value)?[1]
                            if untilDateString and moment(untilDateString).isBefore queryDate
                                isAbsent = false

                # if start is queryDate and duration less then seven hours, add the person to partial-absence list
                else if start.isSame(queryDate, 'day') and end.diff(start) < (7 * 60 * 60 * 1000)
                    isAbsent = true
                    status = 'awayPartial'

                # if both start and end are between yesterday and tomorrow, add the person to absence list
                else if start.isBefore(moment(queryDate).add(1, 'days').subtract(1, 'minutes')) and end.isAfter(queryDate)
                    isAbsent = true

                if isAbsent
                    ++result.members[name].absences.count unless result.members[name].absences[queryDate.format 'YYYY-MM-DD']
                    result.members[name].absences[queryDate.format 'YYYY-MM-DD'] =
                        status: status
                        description: icalEvent.description


        #console.log Object.keys(result.members).length
        result

