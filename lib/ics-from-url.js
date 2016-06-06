import URL from 'url'
import request from 'request'
import fs from 'fs'
import path from 'path'

import Promise from 'bluebird'
Promise.promisifyAll(request)
Promise.promisifyAll(fs)

const TTL = 5 * 60

const CACHE = path.join(path.dirname(__dirname), 'cache')

export default Promise.coroutine(function*(url) {
  let { pathname } = URL.parse(url)
  let basename = path.basename(pathname)
  let cachePathname = path.join(CACHE, basename)
  let mtime = null
  try {
    ({ mtime } = yield fs.statAsync(cachePathname))
  } catch (e) {
    mtime = new Date(0)
  }
  let now = Date.now()
  let status = null
  if (mtime.getTime() + TTL * 1000 < now) {
    try {
      let response = yield request.getAsync(url)

      if (response.statusCode < 300) {
        let teamCalendarData = response.body
        let folderName = path.dirname(cachePathname)
        let exists = yield new Promise(resolver => fs.exists(folderName, resolver))
        if (!exists) {
          yield fs.mkdirAsync(folderName)
        }
        yield fs.writeFileAsync(cachePathname, teamCalendarData)
        return ({ content: teamCalendarData, mtime: now })
      }

      throw new Error(`${response.statusCode} - ${response.statusMessage}`)

    } catch (e) {
      console.warn('could not update ics: %s', e)
    }
  }

  if (!fs.existsSync(cachePathname)) {
    console.error(`could not load cache file from ${cachePathname}`)
    console.error('shutting down')
    process.exit(1)
  }

  let content = yield fs.readFileAsync(cachePathname, 'utf-8')
  return ({ status, mtime, content })
})

