import URL from 'url'
import { promisify } from 'util'
import { get } from 'request'
import { stat, writeFile, readFile } from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import withLock from './with-lock'

const getAsync = promisify(get)
const statAsync = promisify(stat)
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)
const mkdirpAsync = promisify(mkdirp)

const TTL = 5 * 60
const CACHE = path.join(path.dirname(__dirname), 'cache')

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
  console.log('Cached %s into %s', url, cachePathname)
}

export default async function icsFromUrl(url) {
  const { pathname } = URL.parse(url)
  const basename = path.basename(pathname)
  const cachePathname = path.join(CACHE, basename)
  return withLock(cachePathname, async () => {
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

        console.error('%s - %s', response.statusCode, response.statusMessage)
      } catch (e) {
        console.warn('could not update ics: %s', e)
      }
    }

    try {
      const content = await readFileAsync(cachePathname, 'utf-8')
      return ({ status, mtime, content })
    } catch (error) {
      console.error('could not load cache file from %s, shutting down', cachePathname)
      process.exit(1)
      return undefined
    }
  })
}
