createAbsence = (event, day) ->
    if event.calendar.holidays
        return status: 'public-holiday', description: event.name()
    startDate = day.startDate()
    endDate = day.endDate()
    duration = endDate.diff startDate, 'minutes'
    status = if duration < 7 * 60 then 'awayPartial' else 'absent'
    # switch to away (aka. home-office or business travel)
    status = 'away' if status is 'absent' and event.isTravel()
    return status: status, description: event.description()

key = (date) ->
    date.format 'YYYY-MM-DD'

class Member
    constructor: (@team, @name) ->
        @absences = {}
        @selected = false

    events: ->
        for calendar in @team.calendars
            iter = calendar.events()
            until (item = iter.next()).done
                event = item.value
                if event.calendar.holidays or event.name() is @name
                    yield event

    _processInstance: (instance) ->
        dayIterator = instance.days @team.sprint.start
        until (item = dayIterator.next()).done
            day = item.value
            startDate = day.startDate()
            break if startDate.isAfter @team.sprint.end, 'days'

            absence = createAbsence instance.event, day
            @absences[key startDate] = absence

    _processEvent: (event) ->
        instanceIterator = event.instances @team.sprint.start
        until (item = instanceIterator.next()).done
            instance = item.value
            break if instance.startDate().isAfter @team.sprint.end, 'days'
            @_processInstance instance

    createAbsences: ->
        eventIterator = @events()
        until (item = eventIterator.next()).done
            event = item.value
            try
                @_processEvent event
            catch error
                console.warn 'Exception processing %s, skipping further processing: %s', event.name(), error


    getAbsence: (date) ->
        @absences[key date]

module.exports = Member