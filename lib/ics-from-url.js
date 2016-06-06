import URL from 'url'
import request from 'request'
import fs from 'fs'
import path from 'path'
import bunyan from 'bunyan'
import Promise from 'bluebird'

Promise.promisifyAll(request)
Promise.promisifyAll(fs)

const logger = bunyan({ name: 'icsFromURL' })
const TTL = 5 * 60
const CACHE = path.join(path.dirname(__dirname), 'cache')

export default Promise.coroutine(function* icsFromUrl(url) {
  const { pathname } = URL.parse(url)
  const basename = path.basename(pathname)
  const cachePathname = path.join(CACHE, basename)
  let mtime = null
  try {
    ({ mtime } = yield fs.statAsync(cachePathname))
  } catch (e) {
    mtime = new Date(0)
  }
  const now = Date.now()
  const status = null
  if (mtime.getTime() + TTL * 1000 < now) {
    try {
      const response = yield request.getAsync(url)

      if (response.statusCode < 300) {
        const teamCalendarData = response.body
        const folderName = path.dirname(cachePathname)
        const exists = yield new Promise(resolver => fs.exists(folderName, resolver))
        if (!exists) {
          yield fs.mkdirAsync(folderName)
        }
        yield fs.writeFileAsync(cachePathname, teamCalendarData)
        logger.info('Cached %s into %s', url, cachePathname)
        return ({ content: teamCalendarData, mtime: now })
      }

      logger.error('%s - %s', response.statusCode, response.statusMessage)
    } catch (e) {
      logger.warn('could not update ics: %s', e)
    }
  }

  if (!fs.existsSync(cachePathname)) {
    logger.error('could not load cache file from %s, shutting down', cachePathname)
    process.exit(1)
  }

  const content = yield fs.readFileAsync(cachePathname, 'utf-8')
  return ({ status, mtime, content })
})

