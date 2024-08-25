import { useEffect, useMemo, useState } from "react";
import config from "../config";
import { FilesItemType, FilesTypeRecord } from "../types";
import {
    fs,
    _path,
    objToArr,
    getFileDirPath,
    getFileUploadTime,
} from '../utils'
import dayjs from "dayjs";
import { IObservableArray } from "mobx";

const {
    defaultConfig: {
        filesName,
        suffix,
    },
    slash
} = config

const setProperty = async (oldObj: FilesItemType, stats: StatsType, auto: boolean): Promise<FilesItemType> => {
    const { size, birthtime, mtime, atime } = stats
    const unix = (date: Date) => dayjs(date).unix()
    const uploadTime = auto ? await getFileUploadTime(`${oldObj.title}${oldObj.randomSuffix}${suffix}`) : null
    const obj = {
        ...oldObj,
        size,
        birthtime: unix(birthtime),
        mtime: uploadTime ?? unix(mtime),
        atime: uploadTime ?? unix(atime),
        ...(
            uploadTime ? {
                isSynced: true,
                updatedAt: uploadTime
            } : {}
        )
    }
    return obj
}
const filteList = (arr: string[]) => arr.filter((path, idx, arr) => arr.indexOf(path) === idx)

const handleFiles = (
    { filesDataStore, tempFileStore }:
        { filesDataStore: filesDataStoreType, tempFileStore: tempFileStoreType }
): FilesTypeRecord => {
    const files: FilesTypeRecord = filesDataStore.get(filesName, {})
    return Object.keys(files).reduce<typeof files>((pre, id) => {
        pre[id] = {
            ...files[id],
            isUnSave: tempFileStore.has(id)
        }
        return pre;
    }, {})
}

const useFiles: useFilesType = ({ openFileIDs, filesDataStore, tempFileStore }) => {
    const getOpenFiles = (files: FilesTypeRecord) => [...openFileIDs.map(key => ({ ...files[key], isUnSave: tempFileStore.has(key) }))]
    const [files, setFiles] = useState(useMemo(() => handleFiles({ filesDataStore, tempFileStore }), [openFileIDs]))
    const [openFiles, setOpenFiles] = useState(getOpenFiles(files))
    const updateFile = async (newFiles: typeof files, id?: string, isNew: boolean = false) => {
        if (id) {
            Reflect.set(files, id, await setProperty(files[id], fs.statSync(files[id].path), isNew))
            newFiles = id ? { ...newFiles, [id]: { ...newFiles[id], isUnSave: tempFileStore.has(id) } } : newFiles
        }
        filesDataStore.set(filesName, newFiles)
        setFiles(newFiles)
        setOpenFiles(getOpenFiles(newFiles))
        return id;
    }
    const filesList = useMemo(() => objToArr(files), [files])
    const filesPathList = useMemo(() => filteList(filesList.map(file => file.path)), [files])
    const filterFiles = useMemo(() => filesList.filter((file, idx,) => fs.existsSync(file.path) && filesPathList.indexOf(file.path) === idx), [files])
    const dirList = useMemo(() => filterFiles.map(file => getFileDirPath(file.path, slash) + slash), [files])

    useEffect(() => {
        setOpenFiles([...openFiles.filter(item => openFileIDs.includes(item.id))])
    }, [openFileIDs])

    useEffect(() => window.electronApi.chokidarListener({
        files,
        dirList,
        openFiles,
        filterFiles,
        suffix,
        slash,
        getFileDirPath,
        updateFile,
    }), [files])
    return [files, updateFile]
}

type StatsType = import('fs').Stats
type UseFilesRturnType = [
    FilesTypeRecord,
    (files: FilesTypeRecord, id?: string, isNew?: boolean) => Promise<string | undefined>
]

export default useFiles

type tempFileStoreType = ReturnType<Window["electronApi"]['getTempFileStore']>
type filesDataStoreType = ReturnType<Window["electronApi"]['getFilesDataStore']>
type useFilesType = (options: { openFileIDs: IObservableArray<string>, tempFileStore: tempFileStoreType, filesDataStore: filesDataStoreType }) => UseFilesRturnType