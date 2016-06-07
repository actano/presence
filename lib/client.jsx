import './views/styles.styl'
import script from './find-script'
import init from './init'

function isElementInBody(element) {
  let el = element
  while (el) {
    if (el.tagName === 'BODY') return true
    el = el.parentElement
  }
  return false
}

export default function client(Header) {
  let container = document.querySelector('.actano-presence')
  if (!container && script && isElementInBody(script)) {
    container = script.parentElement
  }

  const actanoPresence = init()
  actanoPresence(container, Header)
}
