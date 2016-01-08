moment = require 'moment'

class Helpers
    constructor: (@today) ->

    dayClass: (date) =>
        result = []
        if date.isSame(@today, 'day')
            result.push 'today'
        if date.day() == 5
            result.push 'preWeekend'
        if date.day() == 1
            result.push 'postWeekend'
        result.push if date.week() % 2 then 'weekOdd' else 'weekEven'
        result

    absenceClass: (absence) ->
        if absence.isHoliday()
            return 'public-holiday'
        if absence.isTravel()
            return 'away'
        'absent'

    statusClasses: (member, date, classes) =>
        result = Array::slice.call(arguments, 2)
        absenceIterator = member.absences(date)
        until (item = absenceIterator.next()).done
            absence = item.value
            break if absence.date.isAfter(date, 'day')
            result.push @absenceClass(absence)
        result

    dateArray: (start, end) ->
        result = []
        date = start.clone().startOf 'day'
        until date.isAfter(end, 'day')
            unless date.day() % 6 is 0
                result.push date
            date = date.clone().add 1, 'days'
        result

    absencePercentage: (team, startDate, endDate) ->
        sob = team.startOfBusiness
        eob = team.endOfBusiness
        zero = startDate.clone().startOf('day').add(sob, 'minutes')
        eob -= sob
        start = Math.max(0, startDate.diff(zero, 'minutes'))
        end = Math.min(eob, endDate.diff(zero, 'minutes'))
        {
            start: start / eob
            end: end / eob
        }

    startOfCalendar: (team, date) ->
        start = date.clone()
        start.day -1 unless start.day() is 1
        moment.max start, team.sprint.start

    endOfCalendar: (team, date) ->
        end = date.clone().add 1, 'weeks'
        end.day 7 unless end.day() is 0
        moment.max end, team.sprint.end

module.exports = Helpers
