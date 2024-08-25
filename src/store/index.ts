import { TypeStore } from '../types'
import AppStore from './AppStore'
import ElSession from '../utils/ElSession'

const store: TypeStore = {
    appStore: AppStore,
    elSession: (name: string) => new ElSession(name)
}

export default store