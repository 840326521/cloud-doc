const fs = window.electronApi.require('fs').promises
const isWin = /^win/i.test(window.electronApi.process.platform)
const splitter = isWin ? '\\' : '/'

const fileHelper = {
  readFile: (path) => fs.readFile(path, 'utf8'),
  writeFile: async (path, content) => {
    return fs.writeFile(path, content, 'utf8')
  },
  renameFile: (oldPath, newPath) => fs.rename(oldPath, newPath),
  deleteFile: (path) => fs.unlink(path),
  existsFile: (path, isMkdir = true) =>
    new Promise((resolve) => {
      fs.access(path, async (err) => {
        if (err && isMkdir) {
          await fileHelper.mkdirFile(path)
        }
        resolve(true)
      })
    }),
  mkdirFile: (path) => fs.mkdir(path),
  stat: async (path) => {
    try {
      return await fs.stat(path)
    } catch {
      return null
    }
  }
}

export default fileHelper
