// typings/indexs.d.ts
// 扩展 Window 接口
import React from 'react';
import { callback } from 'qiniu';
import ElectronType from 'electron';
import ElectronStore from 'electron-store';
import { FilesItemType, FilesTypeRecord, GetParentNodeType, SettingsStoreType, TempType } from '../src/types/index';

declare global {
    interface Window {
        electronApi: {
            chokidarListener: (
                options: {
                    files: FilesTypeRecord,
                    dirList: string[],
                    openFiles: FilesItemType[],
                    filterFiles: FilesItemType[],
                    suffix: string,
                    slash: string,
                    getFileDirPath: (path: string, slash: string) => string,
                    updateFile: (files: FilesTypeRecord, id?: string, isNew?: boolean) => Promise<string | undefined>,
                }
            ) => () => void;
            dialogApi: {
                showOpenDialog: ElectronType.Dialog['showOpenDialog'];
            };
            ipcRenderer: IpcRenderer;
            process: {
                platform: NodeJS.Platform;
            };
            webContentsOnApi: {
                'return-upload-time': (callback: (_: any, time?: number) => void) => void;
            },
            ipcRendererOnApi: Record<keyof CallbackType, ipcRendererOnApiFnType>,
            startDrag: (fileName) => void
            setContextMenus: (
                options: {
                    itemArr: Array<{ label: string, click: () => void }>,
                    targetSelector: string,
                    deps: React.DependencyList,
                    getParentNode: GetParentNodeType,
                    callback: (targetElement: HTMLSpanElement) => void
                }
            ) => () => void
            getSettingsStore: StoreType<SettingsStoreType>;
            getFilesDataStore: StoreType<{
                files: FilesItemType,
                tempTabList: {
                    openFileIDs: string[],
                    sortOpenFileIDs: string[]
                }
            }>;
            getTempFileStore: StoreType<Record<string, string>>;
            require: <T = unknown>(path: string) => T;
        };
    }

    type StoreType<S> = (options?: ElectronStore.Options) => {
        get: ElectronStore<S>['get'],
        set: ElectronStore<S>['set'],
        has: ElectronStore<S>['has'],
        reset: ElectronStore<S>['reset'],
        delete: ElectronStore<S>['delete'],
        clear: ElectronStore<S>['clear'],
        getStore: () => ElectronStore<S>['store']
    };

    interface CallbackType {
        'close-file': () => void;
        'create-new-file': () => void;
        'import-files': () => void;
        'save-edit-file': () => Promise<boolean | void> | void;
        'files-upload': (_: any, ids: string[]) => void;
        'file-downloaded': (_: any, { status, id }: { status: 'download-success' | 'no-new-file', id: string }) => void;
        'success-hint': (_: any, message: any) => void,
        'error-hint': (_: any, message: any) => void,
        'loading-status': (_, { status, tip }: { status: boolean; tip?: string }) => void;
        'app-quit': (_: any) => void
    }

    type ChannelKeyofType = keyof CallbackType;


    type ipcRendererOnApiFnType = (channel: ChannelKeyofType, callback: any) => () => IpcRendererReturnType | undefined

    type IpcRenderer = ElectronType.IpcRenderer;

    type IpcRendererReturnType = {
        invoke: IpcRenderer['invoke'];
        postMessage: IpcRenderer['postMessage'];
        send: IpcRenderer['send'];
        sendSync: IpcRenderer['sendSync'];
        sendTo: IpcRenderer['sendTo'];
        sendToHost: IpcRenderer['sendToHost'];
        _events: Record<string, any>;
        _eventsCount: number;
    }
}