export * from './App'
export * from './store'
export * from './utils'
import ElectronStore from 'electron-store'

export type FilesItemType = {
  id: string
  title: string
  path: string
  randomSuffix: string
  birthtime?: number
  mtime?: number
  atime?: number
  body: string
  isDel?: boolean
  isNew?: boolean
  isUnSave?: boolean
  size?: number
  isSynced?: boolean
  isLoaded?: boolean
  updatedAt?: number
}

export type FilesType = FilesItemType[]

export type FilesTypeRecord = Record<string, FilesItemType>

export type ElectronStoreFilesType = Record<string, FilesTypeRecord>

export type SettingsStoreType = {
  currentDomWidth: number
  savedFileLocation: string
  accessKey: string
  secretKey: string
  bucketName: string
  enableAutoSync: boolean
}