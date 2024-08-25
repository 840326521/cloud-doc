import { ObservableSet, action, makeAutoObservable, observable, observe } from 'mobx'
import config from '../config'
import { ActionTypeEnum, FilesItemType, ActionType, OperationType, AppStoreInterface } from "../types";
import { SettingsConfig, findIndex } from '../utils';

const { join } = window.electronApi.require<typeof import('path')>('path')
const { defaultConfig: { suffix }, slash } = config
const filesDataStore = window.electronApi.getFilesDataStore()
const tempTabList = filesDataStore.has('tempTabList') ? filesDataStore.get('tempTabList') : void 0;

class AppStore implements AppStoreInterface {
    nextActiveId: string = ''
    isShow: boolean = false
    isDisabled: boolean = false
    newFile: Omit<FilesItemType, "path"> | null = null
    openFileIDs = observable.array<string>(tempTabList ? tempTabList.openFileIDs : [], { name: 'openFileIDs' })
    sortOpenFileIDs = observable.array<string>(tempTabList ? tempTabList.sortOpenFileIDs : [], { name: 'sortOpenFileIDs' })

    constructor() {
        makeAutoObservable(this)
    }

    getPath = (title?: string) => {
        const path = join(`${SettingsConfig.savedLocation}`)
        return `${path}${title ? `${slash}${title}${suffix}` : ''}`.toLocaleLowerCase()
    }

    setAppStoreValue = ({ type, payload: { isShow, newFile } }: ActionType) => {
        switch (type) {
            case ActionTypeEnum.SET_IS_SHOW:
                this.isShow = isShow!
                break;
            case ActionTypeEnum.SET_NEW_FILE:
                this.newFile = newFile?.isDel ? null : newFile?.value!;
                break;
        }

    }

    #setTempTabList() {
        filesDataStore.set('tempTabList', {
            openFileIDs: [...this.openFileIDs],
            sortOpenFileIDs: [...this.sortOpenFileIDs]
        })
    }

    @action
    amendOpenFileIDs = (id: string | string[], operation: OperationType) => {
        if (!this.openFileIDs.includes(id as string) && operation === 'unshift') {
            (this.openFileIDs as any)[operation](id as any);
            if (!this.sortOpenFileIDs.includes(id as any)) (this.sortOpenFileIDs as any)[operation](id);
            this.#setTempTabList()
        }
    }

    @action
    closeFileIDs = (id: string) => {
        if (this.openFileIDs.length >= 1) {
            const [idx1, idx2] = [findIndex(this.openFileIDs, id), findIndex(this.sortOpenFileIDs, id)]
            idx1 >= 0 && this.openFileIDs.splice(idx1, 1)
            idx2 >= 0 && this.sortOpenFileIDs.splice(idx2, 1)
            this.#setTempTabList()
        }
    }

    @action
    cutOpenFileIDs = (id: string) => {
        if (this.sortOpenFileIDs.length >= 2 && this.sortOpenFileIDs.includes(id)) {
            const idx = findIndex(this.sortOpenFileIDs, id)
            if (idx >= 1) {
                this.sortOpenFileIDs.splice(idx, 1)
                this.sortOpenFileIDs.unshift(id)
                this.#setTempTabList()
            }
        }
    };


}


type OrignalType<T = unknown> = Promise<T> | Array<T>
export type MyAwaited<T> = T extends OrignalType<infer U> ? (U extends OrignalType ? MyAwaited<U> : U) : T;

type ExampleType = Promise<Promise<Promise<Promise<Boolean>>>>
type ArraysType = Array<Array<Array<Array<Array<Promise<Array<Promise<{ name: string, age: number }>>>>>>>>

type ResultArrayType = MyAwaited<ArraysType>
type ResultPromiseType = MyAwaited<ExampleType>
type ResultType = MyAwaited<string>



// type ArraysType = Array<Array<Array<Array<Array<{ name: string, age: number, hobby: Array<string> }>>>>>

// type FilterType<T> = T extends undefined ? true :
//     T extends null ? true :
//     [T] extends [never] ? true :
//     T extends { [Symbol.toStringTag]: "Symbol" } ? true : false


// type OrignalType<T = unknown> = T extends Promise<T> ?
//     Promise<T> :
//     T extends Array<T> ?
//     Array<T> :
//     T


// type ReinforceMyAwaitedArray<T> = FilterType<T> extends true ? T : T extends OrignalType<infer U> ? (U extends OrignalType ? ReinforceMyAwaitedArray<U> : U) : never;

// type ResultType = ReinforceMyAwaitedArray<ArraysType>






export default new AppStore
