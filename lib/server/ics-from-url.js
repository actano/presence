import { readFile, stat, writeFile } from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import { get } from 'request'
import URL from 'url'
import { promisify } from 'util'

import _debug from './debug'

const debug = _debug.extend('ics-from-url')

const getAsync = promisify(get)
const statAsync = promisify(stat)
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)
const mkdirpAsync = promisify(mkdirp)
const running = new Map()

const TTL = 5 * 60
const CACHE = 'cache'

const getCacheModificationTime = async (cachePathname) => {
  try {
    const { mtime } = await statAsync(cachePathname)
    return mtime.getTime()
  } catch (e) {
    return 0
  }
}

const cacheResponse = async (teamCalendarData, cachePathname, url) => {
  const folderName = path.dirname(cachePathname)
  await mkdirpAsync(folderName)
  await writeFileAsync(cachePathname, teamCalendarData)
  debug('Cached %s into %s', url, cachePathname)
}

async function loadFromUrl(url, cachePathname) {
  debug('Loading %s', url)
  const mtime = await getCacheModificationTime(cachePathname)
  const now = Date.now()
  const status = null
  if (mtime + (TTL * 1000) < now) {
    try {
      const response = await getAsync(url)

      if (response.statusCode < 300) {
        const teamCalendarData = response.body
        await cacheResponse(teamCalendarData, cachePathname, url)
        return ({ content: teamCalendarData, mtime: now })
      }

      debug('%s - %s', response.statusCode, response.statusMessage)
    } catch (e) {
      debug('could not update ics: %s', e)
    }
  }

  try {
    debug('Loading %s from cache file', url)
    const content = await readFileAsync(cachePathname, 'utf-8')
    return ({ status, mtime, content })
  } catch (error) {
    debug('Could not load cache file from %s, shutting down', cachePathname)
    process.exit(1)
    return undefined
  }
}

export default async function icsFromUrl(url) {
  const { pathname } = URL.parse(url)
  const basename = path.basename(pathname)
  const cachePathname = path.join(CACHE, basename)
  if (running.has(cachePathname)) return running.get(cachePathname)
  const result = loadFromUrl(url, cachePathname)
  running.set(cachePathname, result.finally(() => running.delete(cachePathname)))
  return result
}
