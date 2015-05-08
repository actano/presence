request = require 'request'
ICAL = require 'ical.js'
moment = require 'moment'

Promise = require 'bluebird'
Promise.promisifyAll request

# load team meta data from json
teams = require './teams'

module.exports = Promise.coroutine ->
    today = new moment hour: 0, minute: 1
    tomorrow = today.add(1, 'days').subtract 2, 'minutes'

    for team in teams
        result =
            members: team.members
            name: team.name
            absentees: []

        [response] = yield request.getAsync team.calender

        jCalData = ICAL.parse response.body
        comp = new ICAL.Component jCalData[1]

        # each logical item in the confluence calendar
        # is a 'vevent'; lookup all events of that type
        for event in comp.getAllSubcomponents 'vevent'
            # parse iCal event
            icalEvent = new ICAL.Event event

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
                # TODO RX-2895 handle exceptions
                # if icalEvent.summary is "Andreas Lubbe"
                #   console.log icalEvent.iterator()
                result.absentees.push icalEvent.summary

        result
