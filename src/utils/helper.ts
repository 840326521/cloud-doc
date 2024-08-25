import { FilesItemType } from "../types"
const { ipcRenderer, webContentsOnApi } = window.electronApi

export const flattenArr = (arr: FilesItemType[]) => {
  return arr.reduce((map, item) => {
    map[item.id] = item
    return map
  }, {} as Record<string, FilesItemType>)
}

export const objToArr = <T = FilesItemType>(obj: Record<string, any>) => Object.values<T>(obj)

export const getParentNode = <D = { id: string, title: string, path: string }>(node: any, parentClassName: string): HTMLDivElement & { dataset: D } | null | undefined => {
  if (!node) return null;
  let current = node
  while (current !== null) {
    if (current.classList.contains(parentClassName)) {
      return current
    }
    current = current.parentNode
  }
  return null
}

export const getFileUploadTime = async (key: string) => new Promise<number | undefined>(resolve => {
  setTimeout(() => {
    ipcRenderer.send('get-upload-time', key)
    webContentsOnApi['return-upload-time']((_, time?: number) => resolve(time ? Math.round(time / 10000000) : time))
  }, 100)
})