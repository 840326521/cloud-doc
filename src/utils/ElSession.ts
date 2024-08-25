import { TempInterface, TempType } from "../types"

const _session = window.localStorage
const JSON = window.JSON

export default class ElSession implements TempInterface {
    session: TempType
    name: string | undefined
    constructor(name: string) {
        Object.defineProperty(this, 'name', {
            configurable: false,
            enumerable: false,
            value: name,
            writable: false
        })
        this.session = this.get()
    }

    get = (): typeof this.session => JSON.parse(_session.getItem(this.name!) ?? '{}')

    set = (name: string, value: string) => {
        this.session[name] = { ...this.session[name], value }
        _session.setItem(this.name!, JSON.stringify(this.session))
    }

    remove = (name: string) => {
        if (Reflect.has(this.session, name)) {
            Reflect.deleteProperty(this.session, name)
            _session.setItem(this.name!, JSON.stringify(this.session))
        }
    }

    clearAll() {
        _session.clear()
    }
}
