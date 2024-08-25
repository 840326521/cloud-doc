import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'
import {
  Button,
  Col,
  Modal,
  Row,
  Spin,
  notification,
  message,
  Popover,
  Radio
} from 'antd'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import SimpleMdeReact from 'react-simplemde-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  fs,
  objToArr,
  fileHelper,
  debounce,
  filterArrFn,
  handlerPathTransitionObj,
  getFileUploadTime
} from './utils'
import InjectObserver from './components/InjectObserver'
import { useFiles, useIpcRenderer, useMoveSetWidth } from './hooks'
import config from './config'
// import { useDrag } from './hooks'
import { ActionTypeEnum, FilesItemType, FilesType } from './types'

const {
  ipcRenderer,
  dialogApi,
  getSettingsStore,
  getTempFileStore,
  getFilesDataStore
} = window.electronApi
const settingsStore = getSettingsStore()
const tempFileStore = getTempFileStore()
const filesDataStore = getFilesDataStore()
const {
  defaultConfig: { suffix },
  slash
} = config
const getAutoSync = () =>
  ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every((key) =>
    settingsStore.has(key)
  )

export default InjectObserver(({ store }) => {
  const {
    isShow,
    newFile,
    openFileIDs,
    sortOpenFileIDs,
    amendOpenFileIDs,
    setAppStoreValue,
    closeFileIDs,
    cutOpenFileIDs,
    getPath
  } = store?.appStore!
  // const [activeFileID, setActiveFileID] = useState<string>(
  //   sortOpenFileIDs[0] ?? ''
  // )
  const activeFileID = useRef(sortOpenFileIDs[0] ?? '')
  const [files, updateFile] = useFiles({
    openFileIDs,
    tempFileStore,
    filesDataStore
  })
  const filesArr = useMemo(() => objToArr(files), [files])
  const saveCurrentFile = async (id?: string) => {
    if (!tempFileStore.has(activeFileID.current)) return
    const { path, title, randomSuffix } = files[id ?? activeFileID.current]
    const callback = () => {
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {
          key: `${title}${randomSuffix}${suffix}`,
          path
        })
      }
      handlerDeleteTempCache(activeFileID.current)
      return true
    }
    return tempFileStore.has(activeFileID.current)
      ? fileHelper
          .writeFile<boolean>(path, tempFileStore.get(activeFileID.current))
          .then(callback)
          .catch((err) => {
            console.log(err)
            return false
          })
      : callback()
  }

  let addFileList = useCallback(
    (filePaths: string[]) => {
      const filterPathsArr = filterArrFn(
        filePaths,
        filesArr.map((file) => file.path.toLocaleLowerCase())
      )
      if (filterPathsArr.length > 0) {
        const newFiles = {
          ...files,
          ...handlerPathTransitionObj(filterPathsArr)
        }
        filterPathsArr
          .reduce<string[]>((pre, curPath) => {
            const findObj = objToArr(newFiles).find(
              (file) => file.path === curPath
            )
            if (findObj) pre.push(findObj.id)
            return pre
          }, [])
          .forEach(async (id) => await updateFile(newFiles, id))
        notificationApi.success({
          message: '导入成功',
          description: `成功导入了${filterPathsArr.length}个文件`,
          placement: 'topRight'
        })
        // filterPathsArr.forEach((item) => amendOpenFileIDs(item, 'push'))
      } else messageApi.warning('选择导入的文件已存在')
    },
    [filesArr, files]
  )
  // const [isShowFileHint, supportSuffixList] = useDrag(addFileList)
  const { parentRef, MoveSetParrentWidth } = useMoveSetWidth(settingsStore)
  const [loading, setLoading] = useState(false)
  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingSaveTip, setLoadingSaveTip] = useState('保存中')
  const [searchedFiles, setSearchedFiles] = useState<FilesType>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isClose, setIsClose] = useState(false)
  const [notificationApi, NotificationContext] = notification.useNotification()
  const [messageApi, MessageContext] = message.useMessage()
  const [type, setType] = useState<number>(0)
  const [isHint, setIsHint] = useState(false)
  const popoverRef = useRef<any>()
  const executeTime = useRef(0)
  const titleList = useMemo(
    () => Object.keys(tempFileStore.getStore()).map((id) => files[id].title),
    [files]
  )
  const fileListArr = searchedFiles.length > 0 ? searchedFiles : filesArr
  const autofocusNoSpellcheckerOptions: EasyMDE.Options = useMemo(
    () => ({
      minHeight: 'calc(100vh - 150px)',
      autofocus: true
    }),
    []
  )

  const propertyIsExist = (target: Record<string, any>, name: string) =>
    Reflect.has(target, name)

  const handlerOpenFileError = async (id: string, errMsg: string) => {
    const file = files[id]
    if (propertyIsExist(files, id)) {
      Reflect.deleteProperty(files, id)
      await updateFile({ ...files })
    }
    messageApi.error(`${errMsg}失败，${file.title}${suffix} 文件不存在`)
    setLoading(false)
  }

  const fileClick = useCallback(
    (fileID: string) => {
      if (
        activeFileID.current === fileID ||
        openFileIDs.findIndex((id) => fileID === id) >= 0
      ) {
        tabClick(fileID)
        return
      }
      tabClick(fileID)
      const currentFile = files[fileID]
      const _updateFile = async (body: string) => {
        setLoading(false)
        amendOpenFileIDs(fileID, 'unshift')
        files[fileID] = { ...currentFile, body }
        await updateFile(files)
        if (tempFileStore.has(fileID)) setFileIsUnSaveStatus()
      }
      setLoading(true)
      if (tempFileStore.has(fileID)) {
        _updateFile(tempFileStore.get(fileID))
      } else {
        fileHelper.readFile(currentFile.path).then(_updateFile, () => {
          const { title, path, id, randomSuffix } = currentFile
          if (getAutoSync()) {
            ipcRenderer.send('download-file', {
              key: `${title}${randomSuffix}${suffix}`,
              path,
              id
            })
            ipcRenderer.on('download-error', (_, id: string) => {
              handlerOpenFileError(id, '打开')
            })
          } else {
            handlerOpenFileError(id, '打开')
          }
        })
      }
    },
    [files, openFileIDs, activeFileID]
  )

  const tabClick = useCallback(
    (fileID: string) => {
      activeFileID.current = fileID
      // setActiveFileID(fileID)
      cutOpenFileIDs(fileID, Object.is(fileID, activeFileID.current))
    },
    [activeFileID]
  )

  const tabClose = useCallback(
    (id?: string) => {
      if (sortOpenFileIDs.length >= 1) {
        id = id ?? activeFileID.current
        if (tempFileStore.has(id)) return setIsOpen(true)
        closeFileIDs(id)
        activeFileID.current = sortOpenFileIDs[0] ?? ''
        // setActiveFileID(sortOpenFileIDs[0] ?? '')
        executeTime.current = 0
      }
    },
    [sortOpenFileIDs, activeFileID]
  )

  const setFileIsUnSaveStatus = () => {
    if (files[activeFileID.current].isUnSave) return
    updateFile({
      ...files,
      [activeFileID.current]: {
        ...files[activeFileID.current],
        isUnSave: tempFileStore.has(activeFileID.current)
      }
    })
  }

  const fileChange = useCallback(
    debounce(
      (body: string) => {
        tempFileStore.set(activeFileID.current, body)
        setFileIsUnSaveStatus()
      },
      500,
      true
    ),
    [activeFileID]
  )

  const deleteFile = useCallback(
    (id: string) => {
      const { path, isNew, isSynced, title, randomSuffix } = files[id]
      fileHelper.deleteFile(path).then(
        async () => {
          const { [id]: value, ...newFiles } = files
          const key = `${title}${randomSuffix}${suffix}`
          await updateFile(newFiles)
          tabClose(id)
          tempFileStore.delete(id)
          if (isNew) {
            setAppStoreValue({
              type: ActionTypeEnum.SET_IS_SHOW,
              payload: { isShow: false }
            })
          }
          if (isSynced && (await getFileUploadTime(key))) {
            return ipcRenderer.send('delete-file', key)
          }
        },
        () => handlerOpenFileError(id, '删除')
      )
    },
    [files]
  )

  const updateFileName = useCallback(
    (id: string, isNew: boolean, title: string) => {
      const file = files[id] ?? newFile
      const oldPath = file.path ?? getPath(title)
      const newPath = oldPath
        ? `${oldPath
            .split(slash)
            .slice(0, -1)
            .join(slash)}${slash}${title}${suffix}`
        : getPath(title)
      const newFiles = {
        ...files,
        [id]: { ...file, title, isNew: false, path: newPath }
      }
      const callback = async () => {
        if (isNew) {
          setAppStoreValue({
            type: ActionTypeEnum.SET_NEW_FILE,
            payload: { newFile: { isDel: true } }
          })
        }
        await updateFile(newFiles, id, !isNew)
      }
      fileHelper[`${isNew ? 'writ' : 'renam'}eFile`](
        oldPath,
        isNew ? file.body : newPath
      ).then(callback, () =>
        handlerOpenFileError(id, `${isNew ? '保存' : '修改'}`)
      )
    },
    [files, newFile]
  )

  const fileSearch = useCallback((keyword: string) => {
    setSearchedFiles(filesArr.filter((file) => file.title.includes(keyword)))
  }, [])

  const createNewFile = useCallback(() => {
    if (isOpen) return
    const id = uuidv4()
    setAppStoreValue({
      type: ActionTypeEnum.SET_IS_SHOW,
      payload: { isShow: true }
    })
    setAppStoreValue({
      type: ActionTypeEnum.SET_NEW_FILE,
      payload: {
        newFile: {
          isDel: false,
          value: {
            id,
            title: '',
            body: '## 请输入 Markdown',
            isNew: true,
            randomSuffix: '.' + id.split(/-/).at(-1)!
          }
        }
      }
    })
  }, [isOpen])

  const handlerDeleteTempCache = async (id?: string) => {
    id = id ?? activeFileID.current
    if (!tempFileStore.has(id)) return
    updateFile(
      {
        ...files,
        [id]: {
          ...files[id],
          body: tempFileStore.get(id),
          isUnSave: false
        }
      },
      id,
      getAutoSync()
    ).then(() => {
      tempFileStore.delete(activeFileID.current)
    })
  }

  const handlerModelButtonClick = useCallback(
    async (status: 0 | 1) => {
      if (isOpen) {
        switch (status) {
          case 0:
            saveCurrentFile().then(
              (status) => status && tabClose(activeFileID.current)
            )
            break
          case 1:
            await handlerDeleteTempCache()
            tabClose(activeFileID.current)
            break
        }
      } else if (isClose) {
        switch (status) {
          case 0:
            try {
              const promiseArr: Array<Promise<string>> = []
              Object.keys(tempFileStore.getStore()).forEach((id) => {
                if (tempFileStore.has(id)) {
                  files[id].body = tempFileStore.get(id)
                }
                tempFileStore.delete(id)
                const { title, path, body, randomSuffix } = files[id]
                if (getAutoSync()) {
                  promiseArr.push(
                    new Promise((resolve) => {
                      ipcRenderer.send('upload-file', {
                        key: `${title}${randomSuffix}${suffix}`,
                        path,
                        id
                      })
                      resolve(id)
                    })
                  )
                }
                fs.writeFileSync(path, body)
              })
              Promise.all(promiseArr).then((resArr) => {
                resArr.forEach(async (id) => {
                  const _id = await updateFile(files, id, getAutoSync())
                  if (_id) {
                    // setIsUpdateObjFn(_id, false)
                    tempFileStore.delete(_id)
                  }
                })
                // closeCurrentApp()
              })
            } catch {
              setLoadingSave(false)
              handlerHint('error', '保存出错')
            }
            break
          case 1:
            closeCurrentApp()
            break
        }
      }
      handlerModalClose()
    },
    [activeFileID, isClose, isOpen, files]
  )

  const importFiles = useCallback(() => {
    dialogApi
      .showOpenDialog({
        title: '选择导入的 Markdown 文件',
        properties: type ? ['openDirectory'] : ['openFile', 'multiSelections'],
        filters: type
          ? []
          : [{ name: 'Markdown 文件', extensions: [suffix.replace(/\./, '')] }]
      })
      .then(({ canceled, filePaths }) => {
        if (canceled) return
        const _filePaths = (
          type
            ? filePaths
                .map((path) =>
                  fs
                    .readdirSync(path)
                    .map((fileName) => `${path}${slash}${fileName}`)
                )
                .flat(2)
            : filePaths.map((path) => path)
        ).map((path) => path.toLocaleLowerCase())
        if (_filePaths.length <= 0 && type) {
          messageApi.error(`${filePaths[0]} 目录下没有 Markdown 文件`, 5)
          return
        }
        const filePathList = _filePaths[0].split(slash)
        if (filePathList.length === 2 && filePathList[1].includes(suffix)) {
          messageApi.warning(
            '为了更好体验，请不要添加根目录下的 Markdown 文件',
            5
          )
          return
        }
        addFileList(_filePaths)
      })
  }, [files, type])

  const handlerModalClose = () => {
    if (isOpen) setIsOpen(false)
    if (isClose) setIsClose(false)
  }

  const handlerHint = (FnName: keyof typeof messageApi, message: any) => {
    if (!isHint) {
      setIsHint(true)
      messageApi[FnName](message, 5, () => setIsHint(false))
    }
  }

  const closeCurrentApp = () => ipcRenderer.send('app-exit')

  const activeFileDownloaded = (
    _: any,
    { status = 'download-success', id = '' }
  ) => {
    const currentFile = files[id]
    const { path } = currentFile
    fileHelper.readFile(path).then(async (body) => {
      let newFile = {} as FilesItemType
      if (status === 'download-success') {
        newFile = {
          ...currentFile,
          body,
          isLoaded: true,
          updatedAt: await getFileUploadTime(`${currentFile.title}${suffix}`)
        }
      } else if (status === 'no-new-file') {
        newFile = { ...currentFile, body, isLoaded: true }
      }
      await updateFile({ ...files, [id]: newFile })
      fileClick(id)
    })
  }

  useIpcRenderer(
    {
      'create-new-file': createNewFile,
      'import-files': importFiles,
      'save-edit-file': async () => await saveCurrentFile(),
      'close-file': () => tabClose(),
      'files-upload'(_: any, ids: string[]) {
        const updateIds = [
          ...new Set([...ids, ...Object.keys(tempFileStore.getStore())])
        ]
        if (updateIds.length > 0) {
          ipcRenderer.send('loading-status', {
            status: true,
            tip: '同步中...'
          })
          Promise.all(updateIds.map((id) => saveCurrentFile(id)))
            .then(() => {})
            .finally(() =>
              setTimeout(() => {
                ipcRenderer.send('loading-status', {
                  status: false
                })
              }, 2000)
            )
        } else handlerHint('info', '已同步至最新')
      },
      'file-downloaded': activeFileDownloaded
      // 'app-quit': () => {
      //   if (openFileIDs.length > 0) {
      //     filesDataStore.set('tempTablist', {
      //       openFileIDs: [...openFileIDs],
      //       sortOpenFileIDs: [...sortOpenFileIDs]
      //     })
      //   }
      //   ipcRenderer.send('app-affirm-quit')
      // }
    },
    []
  )

  useIpcRenderer(
    {
      'success-hint'(_: any, message: any) {
        handlerHint('success', message)
      },
      'error-hint'(_: any, message: any) {
        handlerHint('error', message)
      },
      'loading-status'(_, { status, tip }: { status: boolean; tip?: string }) {
        setLoadingSave(status)
        tip && setLoadingSaveTip(tip)
      }
    },
    []
  )

  useEffect(() => {
    const callback = () => {
      if (openFileIDs.length > 0) {
        filesDataStore.set('tempTabList', {
          openFileIDs: [...openFileIDs],
          sortOpenFileIDs: [...sortOpenFileIDs]
        })
      }
    }
    window.addEventListener('beforeunload', callback)
    return () => window.removeEventListener('beforeunload', callback)
  }, [])

  return (
    <Spin
      wrapperClassName="wrapper-spin"
      spinning={loadingSave}
      tip={`${loadingSaveTip}...`}
    >
      <div className="App">
        <div className="app-layout">
          <div className="left-panel" ref={parentRef}>
            <MoveSetParrentWidth />
            <FileSearch onFileSearch={fileSearch} />
            <FileList
              files={fileListArr}
              onFileClick={fileClick}
              onFileDelete={deleteFile}
              onSaveEdit={updateFileName}
            />
            <Row className="button-group">
              <Col span={12}>
                <BottomBtn
                  colorClass="btn-primary"
                  icon={faPlus}
                  onBtnClick={createNewFile}
                  disabled={isShow}
                />
              </Col>
              <Col span={12}>
                <Popover
                  title="选择类型"
                  placement="top"
                  trigger="click"
                  content={
                    <>
                      <Radio.Group
                        onChange={(e) => setType(e.target.value)}
                        value={type}
                      >
                        <Radio value={0}>文件</Radio>
                        <Radio value={1}>目录</Radio>
                      </Radio.Group>
                      <Button
                        onClick={() => {
                          popoverRef.current.onDocumentClick(popoverRef.current)
                          importFiles()
                        }}
                      >
                        确认
                      </Button>
                    </>
                  }
                  ref={popoverRef}
                >
                  <div>
                    <BottomBtn
                      text="导入"
                      colorClass="btn-success"
                      icon={faFileImport}
                      disabled={isShow}
                    />
                  </div>
                </Popover>
              </Col>
            </Row>
          </div>
          <div className="right-simple-mde">
            {openFileIDs.length <= 0 ? (
              <div className="start-page">选择或者创建 Markdown 文档</div>
            ) : (
              openFileIDs.length > 0 && (
                <Spin spinning={loading} tip="加载中...">
                  <TabList
                    openFiles={openFileIDs.map((key) => ({
                      ...files[key],
                      isUnSave: tempFileStore.has(key)
                    }))}
                    activeId={activeFileID.current}
                    onTabClick={tabClick}
                    onCloseTab={tabClose}
                  />
                  <SimpleMdeReact
                    key={activeFileID.current}
                    // value={activeFileID.current ? files[activeFileID.current].body : ''}
                    value={
                      (tempFileStore.has(activeFileID.current)
                        ? tempFileStore.get(activeFileID.current)
                        : files[activeFileID.current].body) ?? ''
                    }
                    onChange={fileChange}
                    options={autofocusNoSpellcheckerOptions}
                    draggable={false}
                  />
                </Spin>
              )
            )}
          </div>
        </div>
        <Modal
          open={isOpen || isClose}
          onCancel={handlerModalClose}
          title={`是否要保存${
            isOpen
              ? `对  ${files[activeFileID.current]?.title}.md  的更改`
              : `对下列   ${titleList.length}  个文件的更改？`
          }`}
          footer={[
            <Button
              className="bg-success"
              type="primary"
              key={0}
              onClick={() => handlerModelButtonClick(0)}
            >
              {`${isClose ? '全部' : ''}保存`}
            </Button>,
            <Button
              type="primary"
              danger
              key={1}
              onClick={() => handlerModelButtonClick(1)}
            >
              不保存
            </Button>,
            <Button
              className="bg-secondary bg-gradient"
              type="primary"
              key={2}
              onClick={handlerModalClose}
            >
              取消
            </Button>
          ]}
        >
          {isClose && (
            <div
              style={{
                marginBottom: 10,
                maxHeight: '10vh',
                overflow: 'auto'
              }}
            >
              {titleList.map((title) => (
                <p key={title} style={{ margin: 0 }}>
                  {title}
                  {suffix}
                </p>
              ))}
            </div>
          )}
          <span className="text-danger fs-5">如果不保存，你的更改将丢失。</span>
        </Modal>
        <>{NotificationContext}</>
        <>{MessageContext}</>
        {/* <Modal
          style={{
            marginTop: 80
          }}
          open={isShowFileHint}
          keyboard={false}
          footer={null}
          closable={false}
        >
          <Row justify="center">
            <Col
              span={24}
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 'bolder'
              }}
            >
              <span>目前仅支持以下文件进行编辑:</span>
            </Col>
            <Col style={{ width: '100%' }}>
              <Row align="middle" justify="center">
                {supportSuffixList.map((item) => (
                  <Col key={item}>
                    <div className="supportSuffixList">{item}</div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Modal> */}
      </div>
    </Spin>
  )
})
