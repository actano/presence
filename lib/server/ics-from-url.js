import ICAL from 'ical.js'

import _debug from './debug'
import fetch from './fetch'
import locked from './locked'

const debug = _debug.extend('ics-from-url')

export default locked(async (url) => {
  debug('[begin] load %s', url)
  const mtime = Date.now()
  const response = await fetch(url)
  const content = response.body
  debug('parsing %s', url)
  const component = new ICAL.Component(ICAL.parse(content))
  debug('[done] load %s', url)
  return ({ component, content, mtime })
})
