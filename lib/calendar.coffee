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

class Instance
    constructor: (@event, @date) ->
    startDate: -> moment @date
    endDate: -> moment(@date).add @event.duration 'seconds'

module.exports = Calendar