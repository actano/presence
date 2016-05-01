import { expect } from 'chai';
import moment from 'moment';
import config from '../lib/config';

describe('configuration', function() {
    return it('should have correct start date', function() {
        let _config = config(moment('2015-10-01'));
        let team = _config.teams[0];
        expect(team)
            .to.exist;
        return expect(team.sprint.startDate)
            .to.equal('2015-09-30');
    });
});