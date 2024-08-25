import { fs } from "."
const remote = window.electronApi.require<typeof import('@electron/remote')>("@electron/remote")
const { join } = window.electronApi.require<typeof import('path')>('path')
const settingsStore = window.electronApi.getSettingsStore()
class SettingsConfig {
    #SAVED_FILE_LOCATION: string = 'savedFileLocation'
    mdFileDirsPath: string = join(remote.app.getPath('documents'), 'mdFileDirs')
    savedLocation: string;

    constructor() {
        this.savedLocation = settingsStore.get(this.#SAVED_FILE_LOCATION) as typeof this.savedLocation
    }
    init() {
        if (this.savedLocation) {
            const stat = fs.statSync(this.savedLocation)
            if (!stat.isDirectory()) {
                this.#createMdFilesDirs()
            }
        } else {
            this.#createMdFilesDirs()
        }

    }

    #createMdFilesDirs = () => {
        fs.mkdirSync(this.mdFileDirsPath)
        settingsStore.set(this.#SAVED_FILE_LOCATION, this.mdFileDirsPath)
    }
}

export default new SettingsConfig