ICAL = require 'ical.js'
moment = require 'moment'

filterAfter = (start, iter) ->
    until (item = iter.next()).done
        end = item.value.endDate()
        yield item.value if end.isAfter start
    return

class Calendar
    constructor: (content) ->
        @component = new ICAL.Component ICAL.parse content
    events: ->
        # each logical item in the confluence calendar
        # is a 'vevent'; lookup all events of that type
        vevents = @component.getAllSubcomponents 'vevent'
        for event in vevents
            yield new Event this, new ICAL.Event event
            
        return

class Event
    constructor: (calendar, icalEvent) ->
        @calendar = calendar
        @icalEvent = icalEvent

    isTravel: ->
        @icalEvent.component.jCal[1].some ([name, meta, type, value]) ->
            name is 'x-confluence-subcalendar-type' and value is 'travel'

# name ('Who and Description are separated by :')
    summary: -> @icalEvent.summary.split(':')[1]
    name: -> @icalEvent.summary.split(':')[0]
    description: -> @icalEvent.description
    startDate: -> if @icalEvent.startDate? then moment @icalEvent.startDate.toJSDate() else null
    endDate: -> if @icalEvent.endDate? then moment @icalEvent.endDate.toJSDate() else null
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
        return

    confluenceCalendarType: ->
        return @icalEvent.component.getFirstPropertyValue 'x-confluence-subcalendar-type'

    attendees: ->
        attendees = @icalEvent.attendees
        yield new Attendee a for a in attendees
        return

class Attendee
    constructor: (property) ->
        @property = property
    cn: ->
        @property.getParameter 'cn'

class Instance
    constructor: (event, date) ->
        @event = event
        @date = date
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
        return

class Day
    constructor: (start, end) ->
        @start = start
        @end = end
    startDate: -> @start
    endDate: -> @end

module.exports = Calendar