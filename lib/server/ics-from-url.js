import CacheableRequest from 'cacheable-request'
import { readFile as _readFile } from 'fs'
import http from 'http'
import https from 'https'
import ICAL from 'ical.js'
import { promisify } from 'util'
import { get as _get } from 'request'
import { parse } from 'url'

import _debug from './debug'

const get = promisify(_get)
const readFile = promisify(_readFile)

const debug = _debug.extend('ics-from-url')

const running = new Map()

const options = {
  httpModules: {
    https: new CacheableRequest(https.request),
    http: new CacheableRequest(http.request),
  },
}

async function fetch(url) {
  const { protocol, path } = parse(url)
  if (protocol === 'file:') {
    const body = await readFile(path, 'utf-8')
    return { body }
  }
  const response = await get(url, options)
  if (response.statusCode >= 400) {
    throw new Error(`Received ${response.statusCode} from ${url}`)
  }
  return response
}

async function loadFromUrl(url) {
  debug('[begin] load %s', url)
  const mtime = Date.now()
  const response = await fetch(url)
  const content = response.body
  debug('parsing %s', url)
  const component = new ICAL.Component(ICAL.parse(content))
  debug('[done] load %s', url)
  return ({ component, content, mtime })
}

export default async (url) => {
  if (running.has(url)) return running.get(url)
  const result = loadFromUrl(url).finally(() => running.delete(url))
  running.set(url, result)
  return result
}
