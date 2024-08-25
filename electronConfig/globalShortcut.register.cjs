const { globalShortcut } = require('electron')

const registerDict = {
  W: 'close-file'
}

module.exports = (mainWebContents) => {
  Object.keys(registerDict).forEach((key) => {
    const _key = `CommandOrControl+${key}`
    if (globalShortcut.isRegistered(key)) return
    globalShortcut.register(_key, () => {
      mainWebContents.send(registerDict[key])
    })
  })
}
