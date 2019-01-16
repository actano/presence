import { expect } from 'chai'
import { describe, it } from 'mocha'
import config from '../lib/server/config'

/* eslint-disable no-unused-expressions */

describe('configuration', () => {
  it('should have correct start date', async () => {
    const _config = await config('2015-10-01')
    const team = _config.teams[0]
    expect(team).to.exist
    expect(team.sprint.startDate).to.equal('2015-09-30')
  })
})
