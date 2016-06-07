import followTheSun from './redux/follow-the-sun'
import init from './init'
import url from 'url'
import script from './find-script'

function detectUri() {
  const parsed = url.parse(script.src)
  if (parsed.host) {
    parsed.pathname = '/'
    parsed.search = null
    parsed.queryString = null
    return url.format(parsed)
  }
  return undefined
}

const uri = detectUri()

followTheSun()
window.actanoPresence = init(uri)
