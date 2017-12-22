import URL from 'url'
import { promisify } from 'util'
import { get } from 'request'
import { stat, writeFile, readFile } from 'fs'
import path from 'path'
import bunyan from 'bunyan'
import mkdirp from 'mkdirp'

const getAsync = promisify(get)
const statAsync = promisify(stat)
const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)
const mkdirpAsync = promisify(mkdirp)

const logger = bunyan({ name: 'icsFromURL' })
const TTL = 5 * 60
const CACHE = path.join(path.dirname(__dirname), 'cache')

export default async function icsFromUrl(url) {
  const { pathname } = URL.parse(url)
  const basename = path.basename(pathname)
  const cachePathname = path.join(CACHE, basename)
  let mtime = null
  try {
    ({ mtime } = await statAsync(cachePathname))
  } catch (e) {
    mtime = new Date(0)
  }
  const now = Date.now()
  const status = null
  if (mtime.getTime() + (TTL * 1000) < now) {
    try {
      const response = await getAsync(url)

      if (response.statusCode < 300) {
        const teamCalendarData = response.body
        const folderName = path.dirname(cachePathname)
        await mkdirpAsync(folderName)
        await writeFileAsync(cachePathname, teamCalendarData)
        logger.info('Cached %s into %s', url, cachePathname)
        return ({ content: teamCalendarData, mtime: now })
      }

      logger.error('%s - %s', response.statusCode, response.statusMessage)
    } catch (e) {
      logger.warn('could not update ics: %s', e)
    }
  }

  try {
    const content = await readFileAsync(cachePathname, 'utf-8')
    return ({ status, mtime, content })
  } catch (error) {
    logger.error('could not load cache file from %s, shutting down', cachePathname)
    process.exit(1)
    return undefined
  }
}
