import CacheableRequest from 'cacheable-request'
import http from 'http'
import https from 'https'
import { promisify } from 'util'
import { get as _get } from 'request'

import _debug from './debug'

const get = promisify(_get)
const debug = _debug.extend('ics-from-url')

const running = new Map()

const options = {
  httpModules: {
    https: new CacheableRequest(https.request),
    http: new CacheableRequest(http.request),
  },
}

async function loadFromUrl(url) {
  debug('Loading %s', url)
  const now = Date.now()
  const response = await get(url, options)
  if (response.statusCode < 300) {
    debug('Loaded %s', url)
    const teamCalendarData = response.body
    return ({ content: teamCalendarData, mtime: now })
  }
  throw new Error(`Received ${response.statusCode} from ${url}`)
}

export default async (url) => {
  if (running.has(url)) return running.get(url)
  const result = loadFromUrl(url).finally(() => running.delete(url))
  running.set(url, result)
  return result
}
