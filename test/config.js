import { expect } from 'chai';

describe('configuration', function() {
    let {config, moment} = {};

    before('require', function() {
        moment = require('moment');
        return config = require('../lib/config');
    });

    return it('should have correct start date', function() {
        let _config = config(moment('2015-10-01'));
        let team = _config.teams[0];
        expect(team)
            .to.exist;
        return expect(team.sprint.startDate)
            .to.equal('2015-09-30');
    });
});