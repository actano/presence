import CacheableRequest from 'cacheable-request'
import { readFile as _readFile } from 'fs'
import http from 'http'
import https from 'https'
import { get as _get } from 'request'
import { parse } from 'url'
import { promisify } from 'util'

import locked from './locked'

const get = promisify(_get)
const readFile = promisify(_readFile)
const options = {
  httpModules: {
    https: new CacheableRequest(https.request),
    http: new CacheableRequest(http.request),
  },
}

export default locked(async (url) => {
  const { protocol, path } = parse(url)
  if (protocol == null || protocol === 'file:') {
    const body = await readFile(path, 'utf-8')
    return { body }
  }
  const response = await get(url, options)
  if (response.statusCode >= 400) {
    throw new Error(`Received ${response.statusCode} from ${url}`)
  }
  return response
})
