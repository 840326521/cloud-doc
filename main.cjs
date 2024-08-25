const { app } = require('electron')
const { globalShortcutRegister } = require('./electronConfig/index.cjs')

app.whenReady().then(() => {
  const { mainWebContents, globalShortcut } =
    require('./electronConfig/createWindow/index.cjs')(app)

  // 当在使用时 阻止 Ctrl+W 关闭应用
  app.on('browser-window-focus', () => {
    globalShortcutRegister(mainWebContents)
    // 注册某些快捷键, 设置回调函数为空函数，防止这些快捷键的功能生效
    // Prevent these shortcuts from working by registerings them and setting the callback function to an empty function.
    if (app.isPackaged) {
      ;['r', 'i'].forEach((key) => {
        globalShortcut.register(`CommandOrControl+${key}`, () => {})
      })
    }
  })

  // 当离开时 解除 Ctrl+W 关闭应用
  app.on('browser-window-blur', () => {
    globalShortcut.unregisterAll()
  })
})
