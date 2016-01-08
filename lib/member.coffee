Absence = require './absence'

class Member
    constructor: (@calendars, @name) ->

    events: ->
        for calendar in @calendars
            iter = calendar.events()
            until (item = iter.next()).done
                event = item.value
                if event.calendar.holidays or event.name() is @name
                    yield event

    absences: (date) ->
        yield from Absence.fromEvents @events(), this, date

    days: (date) ->
        current = date.clone().startOf 'day'
        day = new Day current

        absenceIterator = @absences date
        until (item = absenceIterator.next()).done
            absence = item.value
            continue if absence.date.isBefore current, 'day'

            while absence.date.isAfter current, 'day'
                yield day
                day = new Day current.add 1, 'days'

            day.absences.push absence

        yield day

    dayArray: (startDate, endDate) ->
        count = 1 + endDate.diff startDate, 'days'
        result = []
        dayIterator = @days(startDate)
        until (item = dayIterator.next()).done
            return result if item.value.date.isAfter endDate
            result.push item.value
        while result.length < count
            result.push new Day startDate.clone().add result.length, 'days'
        result

class Day
    constructor: (date) ->
        @date = date.clone()
        @absences = []

    isWeekend: ->
        return @date.day() is 0 or @date.day() is 6

module.exports = Member