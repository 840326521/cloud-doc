import type { IObservableArray } from "mobx"
import { ActionType, FilesItemType } from ".."

export type TempContentObjType = Record<number, string>

export type OperationType = 'splice' | 'unshift'

export interface AppStoreInterface {
    isShow: boolean
    isDisabled: boolean
    newFile: Omit<FilesItemType, "path"> | null
    openFileIDs: IObservableArray<string>
    sortOpenFileIDs: AppStoreInterface['openFileIDs']
    getPath(title?: string): string
    setAppStoreValue(action: ActionType): void
    amendOpenFileIDs: (id: string[] | string, operation: OperationType) => void
    closeFileIDs: (id: string) => void
    cutOpenFileIDs: (id: string, isActive: boolean) => void
}