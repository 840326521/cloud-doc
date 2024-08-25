module.exports = (store) => {
  return {
    get: (key, defaultValue) => store.get(key, defaultValue),
    set: (key, value) => store.set(key, value),
    has: (key) => store.has(key),
    reset: (...keys) => store.reset(keys),
    delete: (key) => store.delete(key),
    clear: () => store.clear(),
    getStore: () => store.store
  }
}
