const { BrowserWindow } = require('electron')

const basicConfig = {
  width: 1024,
  height: 680,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: true
  },
  show: false
}

const isObject = (target) =>
  typeof target === 'object' && target instanceof Object

const ObjectAssing = (target1, target2) => {
  const keysArray = [
    ...new Set([...Object.keys(target1), ...Object.keys(target2)])
  ]
  const tempObj = {}
  if (keysArray.length <= 0) return {}
  keysArray.forEach((key) => {
    if (Reflect.has(target1, key) && Reflect.has(target2, key)) {
      if (
        (!isObject(target1[key]) && !isObject(target2[key])) ||
        (!isObject(target1) && isObject(target2))
      ) {
        target1[key] = target2[key]
      } else if (isObject(target1[key]) && isObject(target2[key])) {
        target1[key] = ObjectAssing(target1[key], target2[key])
      } else if (isObject(target1) && !isObject(target2)) {
        target1[key] = target1[key]
      }
    } else if (Reflect.has(target1, key) || Reflect.has(target2, key)) {
      tempObj[key] = target1[key] ?? target2[key]
    }
  })
  return { ...target1, ...tempObj }
}

class AppWindow extends BrowserWindow {
  constructor(config, urlLocation) {
    super(ObjectAssing(basicConfig, config))
    this.loadURL(urlLocation)
    this.once('ready-to-show', this.show)
  }
}

module.exports = AppWindow
