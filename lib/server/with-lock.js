const locks = {}

const acquireLock = (key) => {
  let release = null
  const promise = new Promise((resolve) => {
    release = () => {
      resolve()
    }
  })
  const previous = locks[key]
  const next = previous ? previous.then(promise) : promise
  locks[key] = next
  next.then(() => {
    if (locks[key] === next) {
      delete locks[key]
    }
  })
  if (previous) {
    return previous.then(() => release)
  }
  return Promise.resolve(release)
}

export default async (gate, fn) => {
  const release = await acquireLock(gate)
  let result = null
  try {
    result = await fn()
  } finally {
    release()
  }
  return result
}
