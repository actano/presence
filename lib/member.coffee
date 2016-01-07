moment = require 'moment'

createAbsence = (event, day) ->
    startDate = day.startDate()
    if event.calendar.holidays
        return date: startDate, status: 'public-holiday', description: event.name()
    endDate = day.endDate()
    duration = endDate.diff startDate, 'minutes'
    status = if duration < 7 * 60 then 'awayPartial' else 'absent'
    # switch to away (aka. home-office or business travel)
    status = 'away' if status is 'absent' and event.isTravel()
    return date: startDate, status: status, description: event.description()

key = (date) ->
    date.format 'YYYY-MM-DD'

dateCompare = (a, b) ->
    return -1 if a.isBefore b
    return 1 if a.isAfter b
    return 0

class Member
    constructor: (@team, @name) ->
        @_absences = {}
        @selected = false

    events: ->
        for calendar in @team.calendars
            iter = calendar.events()
            until (item = iter.next()).done
                event = item.value
                if event.calendar.holidays or event.name() is @name
                    yield event

    _processEvents: ->
        start = @team.sprint.start

        iterators = []

        absences = (event) ->
            instanceIterator = event.instances start
            until (item = instanceIterator.next()).done
                instance = item.value

                dayIterator = instance.days start
                until (item = dayIterator.next()).done
                    day = item.value
                    yield createAbsence instance.event, day

        sort = (a, b) ->
            return -1 if a.last.done
            return 1 if b.last.done
            dateCompare a.last.value.date, b.last.value.date

        eventIterator = @events()
        until (item = eventIterator.next()).done
            iterator = absences item.value
            last = iterator.next()
            iterators.push {iterator, last}

        iterators.sort sort

        while iterators.length
            next = iterators[0]
            {done, value} = next.last
            if done
                iterators.shift()
                continue
            yield value
            next.last = next.iterator.next()
            iterators.sort sort

    createAbsences: ->
        end = @team.sprint.end
        absenceIterator = @_processEvents()
        until (item = absenceIterator.next()).done
            absence = item.value
            break if absence.date.isAfter end
            @_absences[key absence.date] = absence

    getAbsence: (date) ->
        @_absences[key date]

    absences: (date) ->
        result = []
        for k,absence of @_absences
            continue if date? and date.isAfter absence.date, 'day'
            result.push absence

        result.sort (a,b) -> dateCompare a.date, b.date
        yield a for a in result

    days: (date) ->
        current = moment(date).startOf 'day'
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
            result.push new Day moment(startDate).add result.length, 'days'
        result

class Day
    constructor: (date) ->
        @date = moment date
        @absences = []

    isWeekend: ->
        return @date.day() is 0 or @date.day() is 6

module.exports = Member