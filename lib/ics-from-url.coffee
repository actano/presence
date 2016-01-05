URL = require 'url'
request = require 'request'
fs = require 'fs'
path = require 'path'

Promise = require 'bluebird'
Promise.promisifyAll request
Promise.promisifyAll fs

TTL = 5 * 60

CACHE = path.join path.dirname(__dirname), 'cache'

module.exports = Promise.coroutine (url) ->
    {pathname} = URL.parse url
    basename = path.basename pathname
    cachePathname = path.join CACHE, basename
    mtime = null
    try
        {mtime} = yield fs.statAsync cachePathname
    catch e
        mtime = new Date(0)
    now = Date.now()
    status = null
    if mtime.getTime() + TTL * 1000 < now
        try
            response = yield request.getAsync url

            if response.statusCode < 300
                teamCalendarData = response.body
                folderName = path.dirname cachePathname
                exists = yield new Promise (resolver) -> fs.exists folderName, resolver
                yield fs.mkdirAsync folderName unless exists
                yield fs.writeFileAsync cachePathname, teamCalendarData
                return {content: teamCalendarData, mtime: now}

            throw new Error "#{response.statusCode} - #{response.statusMessage}"

        catch e
            console.warn 'could not update ics: %s', e.stack

    unless fs.existsSync cachePathname
        console.error "could not load cache file from #{cachePathname}"
        console.error "shutting down"
        process.exit 1

    content = yield fs.readFileAsync cachePathname, 'utf-8'
    return {status, mtime, content}

