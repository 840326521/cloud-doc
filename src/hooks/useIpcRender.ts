import { DependencyList, useEffect } from "react"

const { ipcRendererOnApi } = window.electronApi

const useIpcRenderer = (keyCallbackMap: { [K in ChannelKeyofType]?: CallbackType[K] }, deps: DependencyList) => {
    const keyArr = Object.keys(keyCallbackMap) as Array<ChannelKeyofType>
    useEffect(() => {
        keyArr.forEach(key => ipcRendererOnApi[key](key, keyCallbackMap[key]))
    }, deps)
}



export default useIpcRenderer