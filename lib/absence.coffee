class Absence
    constructor: (@date, @status, @description) ->

Absence.fromEvents = (eventIterator, start) ->
    iterators = []
    until (item = eventIterator.next()).done
        iterator = absences item.value, start
        iterator.last = iterator.next()
        iterators.push iterator

    yield from merge iterators

createAbsence = (event, day) ->
    startDate = day.startDate()
    if event.calendar.holidays
        return new Absence startDate, 'public-holiday', event.name()
    endDate = day.endDate()
    duration = endDate.diff startDate, 'minutes'
    status = if duration < 7 * 60 then 'awayPartial' else 'absent'
    # switch to away (aka. home-office or business travel)
    status = 'away' if status is 'absent' and event.isTravel()
    return new Absence startDate, status, event.description()

absences = (event, start) ->
    instanceIterator = event.instances start
    until (item = instanceIterator.next()).done
        instance = item.value

        dayIterator = instance.days start
        until (item = dayIterator.next()).done
            day = item.value
            yield createAbsence instance.event, day

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