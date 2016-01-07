{expect} = require 'chai'

describe 'configuration', ->
    {config, moment} = {}

    before 'require', ->
        moment = require 'moment'
        config = require '../lib/config'

    it 'should have correct start date', ->
        _config = config moment '2015-10-01'
        team = _config.teams[0]
        expect team
            .to.exist
        expect team.sprint.startDate
            .to.equal '2015-09-30'