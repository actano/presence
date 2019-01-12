export default (fn) => {
  const running = new Map()
  return (selector, ...args) => {
    const key = selector || ''
    if (running.has(key)) return running.get(key)
    const result = Promise.resolve(fn(key, ...args)).finally(() => running.delete(key))
    running.set(key, result)
    return result
  }
}
