import { expect } from 'chai';
import { LocalDate } from 'js-joda';

describe('configuration', function() {
    let config;

    before('import', () => {
        return System.import('../lib/config').then((module) => config = module.default);
    });

    it('should have correct start date', function() {
        let _config = config(LocalDate.parse('2015-10-01'));
        let team = _config.teams[0];
        expect(team).to.exist;
        expect(team.sprint.startDate).to.equal('2015-09-30');
    });
});
