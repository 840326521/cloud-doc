const isWin = /^win/ig.test(window.electronApi.process.platform)

const config = {
    defaultConfig: {
        suffix: '.md',
        dirName: 'md',
        filesName: 'files'
    },
    isWin,
    slash: isWin ? '\\' : '/'
}

export default config