fs = require 'fs'
ICAL = require 'ical.js'

describe 'reading ical data', ->
    it 'should parse ics data', ->
        content = fs.readFileSync 'calendars/public-holidays_de.ics', 'utf-8'
        jcalData = ICAL.parse content
        comp = new ICAL.Component jcalData
        for vevent in comp.getAllSubcomponents 'vevent'
            event = new ICAL.Event vevent
            summary = event.summary
            console.log summary


