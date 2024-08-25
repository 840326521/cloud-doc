const p_fs = require('fs/promises')
const fs = require('fs')
const chokidar = require('chokidar')
const Store = require('electron-store')
const { contextBridge, ipcRenderer } = require('electron')
const { Menu, MenuItem, dialog, getCurrentWindow } = require('@electron/remote')
const electorStore = require('../electronStore.cjs')
const { isFn, areStringsEqual } = require('../utils/index.cjs')

const excuteIpcRendererOn = (key, callback) => {
  if (isFn(callback)) {
    ipcRenderer.on(key, callback)
    return () => ipcRenderer.removeListener(key)
  }
}

contextBridge.exposeInMainWorld('electronApi', {
  ipcRenderer,
  dialogApi: {
    showOpenDialog: (options) =>
      dialog.showOpenDialog(getCurrentWindow(), options)
  },
  process: {
    platform: process.platform
  },
  ipcRendererOnApi: [
    'close-file',
    'create-new-file',
    'import-files',
    'save-edit-file',
    'files-upload',
    'file-downloaded',
    'success-hint',
    'error-hint',
    'loading-status'
    // 'app-quit'
  ].reduce((pre, key) => {
    pre[key] = (key, callback) => excuteIpcRendererOn(key, callback)
    return pre
  }, {}),
  webContentsOnApi: {
    'return-upload-time'(callback) {
      getCurrentWindow().webContents.on('return-upload-time', callback)
    }
  },
  chokidarListener({
    files,
    dirList,
    openFiles,
    filterFiles,
    suffix,
    slash,
    getFileDirPath,
    updateFile
  }) {
    const watcherList = dirList.map((path) =>
      chokidar.watch(`${path}*${suffix}`, { persistent: false })
    )
    watcherList.forEach((watcher) => {
      watcher
        .on('add', (path) => {
          path = path.toLocaleLowerCase()
          const tempFile = filterFiles.find(
            (file) =>
              getFileDirPath(file.path, slash) ===
                getFileDirPath(path, slash) && !fs.existsSync(file.path)
          )
          if (tempFile) {
            tempFile.path = path
            tempFile.title = getPathName(path)
            updateFile({ ...files, [tempFile.id]: tempFile }, tempFile.id)
          }
        })
        .on('change', async (path) => {
          const { body, ...currentFile } = openFiles.find(
            (item) => item.path === path
          )
          const newBody = await p_fs.readFile(currentFile.path, 'utf8')
          if (currentFile && !(await areStringsEqual(newBody, body))) {
            updateFile({
              ...files,
              [currentFile.id]: {
                ...currentFile,
                body: newBody
              }
            })
          }
        })
        .on('unlink', (path) => {
          const tempFile = filterFiles.find((file) => file.path === path)
          if (tempFile) {
            files[tempFile.id] = {
              ...files[tempFile.id],
              isDel: true
            }
            updateFile(files)
          }
        })
    })
    return () => {
      watcherList.forEach((watcher) => watcher.close())
    }
  },
  setContextMenus: ({
    itemArr,
    targetSelector,
    getParentNode,
    deps,
    callback
  }) => {
    const menu = new Menu()
    const handleContextMenu = (e) => {
      // only show the context menu on current dom element targetSelector contains target
      const targetSelectorDom = document.querySelector(targetSelector)
      if (!targetSelectorDom) return
      if (targetSelectorDom.contains(e.target)) {
        const parentNode = getParentNode(e.target, 'file-item')
        if (
          parentNode &&
          parentNode.dataset.id &&
          parentNode?.dataset.id !== deps[0]
        ) {
          callback(e.target)
          menu.popup({ window: getCurrentWindow() })
        }
      }
    }
    itemArr.forEach((item) => menu.append(new MenuItem(item)))
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  },
  getSettingsStore: () => electorStore(new Store({ name: 'Settings' })),
  getFilesDataStore: () => electorStore(new Store({ name: 'Files Data' })),
  getTempFileStore: () => electorStore(new Store({ name: 'TEMP_CONTENT' })),
  require: (path) => require(path)
})
