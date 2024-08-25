import { inject, observer } from 'mobx-react'
import { TypeStore } from '../types'
export default function InjectObserver<T = unknown>(
    children: React.FC<
        {
            store?: TypeStore
        } & T
    >
) {
    return inject((store) => store)(observer(children))
}
