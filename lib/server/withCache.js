export default (fn) => {
  let cached = false
  let cache
  return () => {
    if (!cached) {
      cache = fn()
      cached = true
    }
    return cache
  }
}
