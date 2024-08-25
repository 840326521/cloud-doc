const { ipcRenderer } = require('electron')
const remote = require('@electron/remote')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const qinniuConfigArr = [
  '#savedFileLocation',
  '#accessKey',
  '#secretKey',
  '#bucketName'
]

const $ = (selector) => {
  const result = document.querySelectorAll(selector)
  return result.length > 1 ? result : result.length === 1 ? result[0] : null
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    qinniuConfigArr.forEach((selector) => {
      const savedValue = settingsStore.get(selector.replace('#', ''))
      if (savedValue) {
        $(selector).value = savedValue
      }
    })

    $('#select-new-location').addEventListener(
      'click',
      () => {
        remote.dialog
          .showOpenDialog(remote.getCurrentWindow(), {
            properties: ['openDirectory'],
            message: '选择文件的存储路径'
          })
          .then(({ canceled, filePaths }) => {
            if (!canceled && Array.isArray(filePaths) && filePaths.length > 0) {
              $('#savedFileLocation').value = filePaths[0]
            }
          })
      },
      { passive: true }
    )

    $('#settings-form').addEventListener(
      'submit',
      (e) => {
        e.preventDefault()
        qinniuConfigArr.forEach((selector) => {
          const selectorDom = $(selector)
          if (selectorDom) {
            const { id, value } = selectorDom
            settingsStore.set(id, value ? value : '')
          }
        })
        // sent a event back to main process to enable menu items if qiniu is configed
        ipcRenderer.send('config-is-saved')
        remote.getCurrentWindow().close()
      },
      { passive: true }
    )

    $('.nav-tabs').addEventListener('click', (e) => {
      e.preventDefault()
      if (e.target.classList.contains('nav-link')) {
        $('.nav-link').forEach((element) => {
          element.classList.remove('active')
        })
        e.target.classList.add('active')
        $('.config-area').forEach((element) => {
          element.style.display = 'none'
        })
        $(e.target.dataset.tab).style.display = 'block'
      }
    })
  },
  { passive: true }
)
