ICAL = require 'ical.js'
moment = require 'moment'

str = (moment) -> moment.format 'YYYY-MM-DD HH:mm'

filterAfter = (start, iter) ->
    until (item = iter.next()).done
        end = item.value.endDate()
#        _start = item.value.startDate()
#        console.log "#{str start}: #{str _start} - #{str end}"
        yield item.value if end.isAfter start

class Calendar
    constructor: (content) ->
        @component = new ICAL.Component ICAL.parse content
    events: ->
        # each logical item in the confluence calendar
        # is a 'vevent'; lookup all events of that type
        for event in @component.getAllSubcomponents 'vevent'
            yield new Event this, new ICAL.Event event

class Event
    constructor: (@calendar, @icalEvent) ->

    isTravel: ->
        @icalEvent.component.jCal[1].some ([name, meta, type, value]) ->
            name is 'x-confluence-subcalendar-type' and value is 'travel'

# name ('Who and Description are separated by :')
    summary: -> @icalEvent.summary.split(':')[1]
    name: -> @icalEvent.summary.split(':')[0]
    description: -> @icalEvent.description
    startDate: -> moment @icalEvent.startDate?.toJSDate()
    endDate: -> moment @icalEvent.endDate?.toJSDate()
    duration: (unit) ->
        @endDate().diff @startDate(), unit

    instances: (startTime) ->
        if startTime?
            yield from filterAfter startTime, @instances()
            return

        unless @icalEvent.isRecurring()
            yield new Instance this, @startDate()
            return

        iter = @icalEvent.iterator()
        while (v = iter.next())?
            date = moment v.toJSDate()
            yield new Instance this, date

    confluenceCalendarType: ->
        return @icalEvent.component.getFirstPropertyValue 'x-confluence-subcalendar-type'

class Instance
    constructor: (@event, @date) ->
        @end = moment(@date).add @event.duration('seconds'), 'seconds'
    startDate: -> moment @date
    endDate: -> moment @end
    days: (start) ->
        if start?
            return yield from filterAfter start, @days()
        startDate = @date
        endDate = @end
        next = moment(startDate).add(1, 'days').startOf 'day'
        until startDate.isSame endDate, 'days'
            yield new Day startDate, moment next
            startDate = moment next
            next.add 1, 'days'
        yield new Day startDate, endDate unless startDate.isSame endDate

class Day
    constructor: (@start, @end) ->
    startDate: -> @start
    endDate: -> @end

module.exports = Calendar