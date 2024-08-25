const { app, shell, ipcMain, globalShortcut } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const isproduction = app.isPackaged

const setCtrlKey = (v) => `CommandOrControl+${v}`

const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(
  (key) => !!settingsStore.get(key)
)
let enableAutoSync = settingsStore.get('enableAutoSync')
let template = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建',
        accelerator: setCtrlKey('N'),
        click: (_, browserWindow) => {
          browserWindow.webContents.send('create-new-file')
        }
      },
      {
        label: '保存',
        accelerator: setCtrlKey('S'),
        click: (_, browserWindow) => {
          browserWindow.webContents.send('save-edit-file')
        }
      },
      {
        label: '搜索',
        accelerator: setCtrlKey('F'),
        click: (_, browserWindow) => {
          browserWindow.webContents.send('search-file')
        }
      },
      {
        label: '导入',
        accelerator: setCtrlKey('O'),
        click: (_, browserWindow) => {
          browserWindow.webContents.send('import-files')
        }
      }
      // {
      //   label: '关闭全部',
      //   accelerator: setCtrlKey('W'),
      //   click: (_, browserWindow) => {
      //     browserWindow.webContents.send('close-all')
      //   }
      // }
    ]
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        accelerator: setCtrlKey('Z'),
        role: 'undo'
      },
      {
        label: '重做',
        accelerator: `Shift+${setCtrlKey('Z')}`,
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: '剪切',
        accelerator: setCtrlKey('Y'),
        role: 'cut'
      },
      {
        label: '复制',
        accelerator: setCtrlKey('C'),
        role: 'copy'
      },
      {
        label: '粘贴',
        accelerator: setCtrlKey('V'),
        role: 'paste'
      },
      {
        label: '全选',
        accelerator: setCtrlKey('A'),
        role: 'selectall'
      }
    ]
  },
  {
    label: '云同步',
    submenu: [
      {
        label: '设置',
        accelerator: setCtrlKey(','),
        click: () => {
          ipcMain.emit('open-settings-window')
        }
      },
      {
        label: '自动同步',
        type: 'checkbox',
        enabled: qiniuIsConfiged,
        checked: enableAutoSync,
        click: () => {
          settingsStore.set('enableAutoSync', !enableAutoSync)
        }
      },
      {
        label: '全部同步至云端',
        enabled: qiniuIsConfiged,
        click: () => {
          ipcMain.emit('upload-all-to-qiniu')
        }
      },
      {
        label: '从云端下载到本地',
        enabled: qiniuIsConfiged,
        click: () => {}
      }
    ]
  },
  {
    label: '视图',
    submenu: [
      {
        label: '刷新当前页面',
        accelerator: setCtrlKey('R'),
        click: (item, focusedWindow) => {
          if (focusedWindow) focusedWindow.reload()
        }
      },
      {
        label: '切换全屏幕',
        accelerator: (() => {
          if (process.platform === 'darwin') return 'Ctrl+Command+F'
          else return 'F11'
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
        }
      },
      {
        label: '切换开发者工具',
        accelerator:
          process.platform === 'darwin' ? 'Alt+Command+I' : setCtrlKey('I'),
        click: (item, focusedWindow) => {
          if (focusedWindow) focusedWindow.toggleDevTools()
        }
      }
    ]
  },
  {
    label: '窗口',
    role: 'window',
    submenu: [
      {
        label: '最小化',
        accelerator: setCtrlKey('M'),
        role: 'minimize'
      },
      {
        label: '关闭',
        accelerator: setCtrlKey('W'),
        role: 'close'
      }
    ]
  },
  {
    label: '帮助',
    role: 'help',
    submenu: [
      {
        label: '学习更多',
        click: () => {
          shell.openExternal('http://electron.atom.io')
        }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        label: `关于 ${name}`,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: '设置',
        accelerator: 'Command+,',
        click: () => {
          ipcMain.emit('open-settings-window')
        }
      },
      {
        label: '服务',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: `隐藏 ${name}`,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: '隐藏其它',
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      },
      {
        label: '显示全部',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        accelerator: 'Command+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  })
} else {
  template[0].submenu.push({
    label: '设置',
    accelerator: 'Ctrl+,',
    click: () => {
      ipcMain.emit('open-settings-window')
    }
  })
}

module.exports = template
