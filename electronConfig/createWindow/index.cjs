const {
  globalShortcut,
  Menu,
  ipcMain,
  dialog,
  ipcRenderer
} = require('electron')
const path = require('path')
const remoteMain = require('@electron/remote/main')
const ElectronStore = require('electron-store')

const propertyArr = ['accessKey', 'secretKey', 'bucketName']
const settingsStore = new ElectronStore({ name: 'Settings' })
const createManager = () =>
  new QiniuManager(...propertyArr.map((item) => settingsStore.get(item)))
const fileStore = new ElectronStore({ name: 'Files Data' })
const suffix = '.md'

const getLocationPath = (relativePatgh) =>
  `file://${path.join(__dirname, relativePatgh)}`

const {
  menuTemplate,
  AppWindow,
  utils: { QiniuManager }
} = require('../index.cjs')

const createWindow = (app) => {
  // console.log('Electron version:', process.versions.electron)
  // console.log('Node.js version:', process.versions.node)
  // console.log('Chromium version:', process.versions.chrome)
  // console.log('Preload script path:', `${__dirname}\\electronConfig\\preload.cjs`)
  remoteMain.initialize()
  ElectronStore.initRenderer()
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
  let mainWindow
  const mainWindowConfig = {
    width: 1024,
    height: 680,
    webPreferences: {
      preload: `${__dirname}\\preload.cjs`
    }
  }
  const urlLocation = !app.isPackaged
    ? 'http://localhost:5173'
    : getLocationPath('./dist/inex.html')
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  mainWindow.setIgnoreMouseEvents(false)
  const mainWebContents = mainWindow.webContents
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  remoteMain.enable(mainWebContents)

  const handlerSend = (channel, message) => {
    mainWebContents.send(channel, message)
  }

  mainWebContents.on('will-navigate', (e, url) => {
    e.preventDefault()
    console.log('e:', e)
    console.log('url:', url)
  })

  ipcMain.on('app-exit', () => app.exit())

  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 800,
      height: 680,
      autoHideMenuBar: true,
      frame: true,
      parent: mainWindow,
      modal: true
    }
    const settingsFileLocation = `file://${path.join(
      __dirname,
      './settings/settings.html'
    )}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    // settingsWindow.on('closed', () => {
    //   mainWindow = null
    // })
    // remoteMain.enable(settingsWindow.webContents)
  })

  ipcMain.on('upload-all-to-qiniu', async () => {
    const manager = createManager()
    const filesObj = fileStore.get('files') || {}
    const filesArr = Object.keys(filesObj).reduce((pre, cur) => {
      pre.push(filesObj[cur])
      return pre
    }, [])
    try {
      const syncArr = filesArr.filter((file) => file.isSynced)
      const syncFilterTimeArr = await Promise.all(
        syncArr.map(async (file) => ({
          [file.id]: Math.round(
            (
              await manager.getState(
                `${file.title}${file.randomSuffix}${suffix}`
              )
            ).putTime / 10000000
          )
        }))
      )
      const filterSyncFilterTimeArr = syncFilterTimeArr.reduce((pre, cur) => {
        const key = Object.keys(cur)[0]
        const currentObj = filesObj[key]
        if (currentObj.updatedAt !== cur[key]) {
          pre.push(currentObj)
        }
        return pre
      }, [])
      // mainWebContents.send('loading-status', { status: true, tip: '同步中' })
      mainWebContents.send(
        'files-upload',
        [
          ...filesArr.filter((file) => !file.isSynced),
          ...filterSyncFilterTimeArr
        ].map((file) => file.id)
      )
    } catch (err) {
      handlerSend('error-hint', '同步失败，请检查七牛云参数是否正确')
    }
  })

  ipcMain.on('delete-file', (_, key) => {
    const manager = createManager()
    manager
      .deleteFile(key)
      .then(() => {
        handlerSend('success-hint', '删除成功')
      })
      .catch(() => {
        handlerSend('error-hint', '删除失败，请检查七牛云参数是否正确')
      })
  })

  ipcMain.on('config-is-saved', () => {
    // watch out menu items index for mac and windows
    let qiniuMenu = menu.items[process.platform === 'darwin' ? 3 : 2]
    const switchItems = (toggle) => {
      ;[1, 2, 3].forEach((num) => {
        qiniuMenu.submenu.items[num].enabled = toggle
      })
    }
    const qiniuIsConfiged = propertyArr.every((key) => settingsStore.has(key))
    switchItems(qiniuIsConfiged)
  })

  ipcMain.on('upload-file', (_, { key, path }) => {
    const manager = createManager()
    manager.uploadFile(key, path).then(
      () => {
        handlerSend('success-hint', '上传成功')
      },
      () => {
        handlerSend('error-hint', '同步失败，请检查七牛云参数是否正确')
      }
    )
  })

  ipcMain.on('download-file', (_, { key, path, id }) => {
    const manager = createManager()
    manager.getState(key).then(
      (resp) => {
        const filesObj = fileStore.get('files')
        const serverUpdatedTime = Math.round(resp.putTime / 10000)
        const localUpdateTime = filesObj[id].updateAt
        if (serverUpdatedTime > localUpdateTime || !localUpdateTime) {
          manager.downloadFile(key, path).then(() => {
            mainWebContents.send('file-downloaded', {
              status: 'download-success',
              id
            })
          })
        } else {
          mainWebContents.send('file-downloaded', { status: 'no-new-file', id })
        }
      },
      () => {
        mainWebContents.send('download-error', id)
      }
    )
  })

  ipcMain.on('get-upload-time', (_, key) => {
    const manager = createManager()
    manager.getState(key).then(
      (res) => {
        mainWebContents.send('return-upload-time', res.putTime)
      },
      () => {
        mainWebContents.send('return-upload-time', undefined)
      }
    )
  })

  // let isQuit = false
  // ipcMain.on('app-affirm-quit', () => {
  //   isQuit = true
  //   app.quit()
  // })

  mainWindow.on('closed', () => {
    mainWindow = null
    globalShortcut.unregisterAll()
    mainWebContents.removeAllListeners()
  })

  // 窗口关闭前，处理函数
  // mainWindow.on('close', (event) => {
  //   // 在这里你可以执行一些准备关闭程序的逻辑
  //   // 例如保存数据或其他必要操作
  //   if (!isQuit) {
  //     event.preventDefault()
  //     mainWebContents.send('app-quit')
  //   }
  // })

  // app.on('window-all-closed', () => {
  //   if (process.platform !== 'darwin') {
  //     app.quit()
  //   }
  // })

  // app.on('window-all-closed', () => {
  //   mainWebContents.removeAllListeners()
  // })

  // if (!app.isPackaged) {
  //   ;['']
  // }
  return { mainWebContents, globalShortcut }
}

module.exports = createWindow
