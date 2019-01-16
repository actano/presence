const withCache = (ttl, fn) => {
  if (typeof ttl === 'function') return withCache(0, ttl)

  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (!cache.has(key)) {
      cache.set(key, fn(...args))
      setTimeout(() => cache.delete(key), ttl * 1000).unref()
    }
    return cache.get(key)
  }
}

export default withCache
