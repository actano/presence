import { expect } from 'chai'
import { LocalDate } from 'js-joda'
import { describe, before, it } from 'mocha'

/* eslint-disable no-unused-expressions */

describe('configuration', () => {
  let config
  function importConfig(module) {
    config = module.default
  }

  before('import', () => System.import('../lib/config').then(importConfig))

  it('should have correct start date', () => {
    const _config = config(LocalDate.parse('2015-10-01'))
    const team = _config.teams[0]
    expect(team).to.exist
    expect(team.sprint.startDate).to.equal('2015-09-30')
  })
})
