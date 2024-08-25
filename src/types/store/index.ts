import { ElSession } from '../../utils'
import { AppStoreInterface } from './AppStore'

export * from './AppStore'
export type TypeStore = {
    appStore: AppStoreInterface
    elSession(name: string): ElSession
}

new Array()