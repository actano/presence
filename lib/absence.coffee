moment = require 'moment'

class Absence
    constructor: (@member, @event, @day) ->
        @date = @day.startDate()
        if @event.calendar.holidays
            @description = @event.name()
            @startPercentage = 0
            @endPercentage = 1
        else
            zero = moment(@date).startOf 'day'
            sob = @member.team.startOfBusiness
            eob = @member.team.endOfBusiness

            start = Math.max sob, @date.diff zero, 'minutes'
            end = Math.min eob, @day.endDate().diff zero, 'minutes'

            @startPercentage = (start - sob) / (eob - sob)
            @endPercentage = (end - sob) / (eob - sob)
            @description = @event.description()

    isHoliday: ->
        @event.calendar.holidays

    isTravel: ->
        @event.isTravel()

    isAbsence: ->
        not (@isHoliday() or @isTravel())

Absence.fromEvents = (eventIterator, member, start) ->
    iterators = []
    until (item = eventIterator.next()).done
        iterator = absences item.value, member, start
        iterator.last = iterator.next()
        iterators.push iterator

    yield from merge iterators

absences = (event, member, start) ->
    instanceIterator = event.instances start
    until (item = instanceIterator.next()).done
        instance = item.value

        dayIterator = instance.days start
        until (item = dayIterator.next()).done
            day = item.value
            yield new Absence member, instance.event, day

compareIterators = (a, b) ->
    return -1 if a.last.done
    return 1 if b.last.done
    dateCompare a.last.value.date, b.last.value.date

merge = (iterators) ->
    iterators.sort compareIterators
    while iterators.length
        iterator = iterators[0]
        {done, value} = iterator.last
        if done
            iterators.shift()
            continue
        yield value
        iterator.last = iterator.next()
        iterators.sort compareIterators

dateCompare = (a, b) ->
    return -1 if a.isBefore b
    return 1 if a.isAfter b
    return 0

module.exports = Absence