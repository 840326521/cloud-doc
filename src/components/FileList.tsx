import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import { Button, Input, InputRef, Modal, message, Popover } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useKeyPress, useContextMenu } from '../hooks'
import InjectObserver from './InjectObserver'
import { getParentNode, handlerFormat, objToArr } from '../utils'
import config from '../config'

import type Electron from '@electron/remote'
import { ActionTypeEnum, FilesItemType } from '../types'

const { shell }: typeof Electron =
  window.electronApi.require('@electron/remote')
const {
  defaultConfig: { suffix }
} = config
const propertyNameObj: { [key: string]: string } = {
  title: '文件名',
  size: '文件大小',
  path: '文件位置',
  birthtime: '创建时间',
  mtime: '最近修改',
  atime: '最近访问',
  updatedAt: '最近同步'
}

export default memo(
  InjectObserver<FileListPropsType>((props) => {
    const placeholder = '请输入文件名称'
    const { store, files, onFileClick, onSaveEdit, onFileDelete } = props
    const { isShow, newFile, setAppStoreValue, getPath } = store?.appStore!
    const filesArr = useMemo(() => objToArr(files), [files])
    const [editStatus, setEditStatus] = useState<string | false>(false)
    const [value, setValue] = useState<string>('')
    const [enterPressed, escPressed] = [useKeyPress(13), useKeyPress(27)]
    const [messageApi, MessageContext] = message.useMessage()
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState<string | null>(null)
    const [id, setId] = useState<string | null>(null)
    const nodeRef = useRef<InputRef | null>(null)
    const getEditItem = () =>
      files.find((file) => file.id === editStatus) ?? newFile!

    const handllerMenuClick = (
      target: EventTarget | null | undefined,
      idx: number
    ) => {
      const parentNode = getParentNode(target, 'file-item')
      if (parentNode) {
        const { id, title } = parentNode.dataset
        switch (idx) {
          case 0:
            onFileClick(id)
            break
          case 1:
            handlerRechristen(id, title)
            break
          case 2:
            setIsOpen(true)
            setTitle(title)
            setId(id)
            break
        }
      }
    }

    const clickedElement = useContextMenu(
      ['打开', '重命名', '删除'].map((label, idx) => ({
        label,
        click: () => handllerMenuClick(clickedElement.current, idx)
      })),
      '.flie-list',
      [files]
    )

    const showErrorHint = (description: string) => {
      messageApi.warning(description)
    }

    const setIsShow = (isShow: boolean) => {
      setAppStoreValue({
        type: ActionTypeEnum.SET_IS_SHOW,
        payload: { isShow }
      })
    }

    const closeSearch = (editItem: OmitType) => {
      clearAppStateFn()
      if (editItem?.isNew && !newFile) {
        onFileDelete(editItem.id)
      } else if (newFile) {
        setAppStoreValue({
          type: ActionTypeEnum.SET_NEW_FILE,
          payload: { newFile: { isDel: true } }
        })
      }
    }

    const clearAppStateFn = () => {
      setIsShow(false)
      setEditStatus(false)
      setValue('')
    }

    const handlerFocus = () => {
      setTimeout(() => nodeRef.current?.focus(), 100)
    }

    const handlerOnSaveEdit = (editItem: OmitType): boolean => {
      if (value.trim() === '') {
        showErrorHint(placeholder)
        handlerFocus()
        return false
      }
      if (value.length > 20) {
        showErrorHint('文件名过长，最多20个字符')
        return false
      }
      if (!editItem.isNew && editItem.title === value.trim()) {
        clearAppStateFn()
        return false
      }
      if (
        filesArr.findIndex(
          (file) => file.path === getPath(value).toLocaleLowerCase()
        ) >= 0
      ) {
        showErrorHint(`${value}${suffix} 文件已存在，请重命名！`)
        handlerFocus()
        return false
      }
      return true
    }

    const handlerSave = () => {
      const editItem = getEditItem()
      if (handlerOnSaveEdit(editItem)) {
        onSaveEdit(editItem.id, editItem.isNew ?? false, value)
        clearAppStateFn()
      }
    }

    const handlerRechristen = (id: string, title: string) => {
      setEditStatus(id)
      setValue(title)
      setIsShow(true)
      handlerFocus()
    }

    const handlerCancel = () => {
      setIsOpen(false)
      setTitle(null)
      setId(null)
    }

    const handlerOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {}

    const handlerFilePopover = (file: FilesItemType) => {
      const propertyNameList = Object.keys(propertyNameObj)
      const _handlerFormat = (value: any, property: any) =>
        ['birthtime', 'mtime', 'atime', 'updatedAt'].some(
          (item) => item === property
        )
          ? handlerFormat(value * 1000)
          : value
      return (
        <div style={{ fontSize: 16 }}>
          {propertyNameList.map((property, idx) => {
            const titleName = propertyNameObj[property]
            const isPath = titleName === propertyNameObj.path
            const fullPath = Reflect.get(file, property)
            return (
              property in file && (
                <p
                  title={isPath ? '双击打开当前文件位置' : ''}
                  style={{
                    cursor: isPath ? 'pointer' : 'default',
                    userSelect: isPath ? 'none' : 'auto'
                  }}
                  onDoubleClick={
                    isPath
                      ? () => {
                          shell.showItemInFolder(fullPath)
                          shell.beep()
                        }
                      : void 0
                  }
                  key={idx}
                >
                  {titleName}:&nbsp;&nbsp;{_handlerFormat(fullPath, property)}
                </p>
              )
            )
          })}
        </div>
      )
    }

    useEffect(() => {
      if (!isShow) return
      if (enterPressed) {
        handlerSave()
      } else if (escPressed) {
        closeSearch(getEditItem())
      }
    }, [enterPressed, escPressed])

    useEffect(() => {
      if (isShow) {
        handlerFocus()
      }
    }, [isShow])

    return (
      <>
        <ul className="list-group list-group-flush flie-list">
          {files
            .filter((item) => !item.isDel)
            .map((file) => (
              <Popover key={file.id} content={handlerFilePopover(file)}>
                <li
                  // className={`list-group-item bg-light row d-flex align-items-center file-item mx-0 d-${file.id !== editStatus && !file.isNew ? 'block' : 'none'}`}
                  className={`list-group-item bg-light row d-flex align-items-center file-item mx-0`}
                  data-id={file.id}
                  data-title={file.title}
                  data-path={file.path}
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={() => !isShow && onFileClick(file.id)}
                >
                  {
                    <>
                      <span className="col-2">
                        <FontAwesomeIcon size="lg" icon={faMarkdown} />
                      </span>
                      <span className="col-6 c-link">{file.title}</span>
                    </>
                  }
                </li>
              </Popover>
            ))}
        </ul>
        <Modal
          title={newFile ? '创建文件' : '修改文件名'}
          okText={newFile ? '创建' : '保存'}
          cancelText="取消"
          maskClosable={false}
          open={isShow}
          onOk={handlerSave}
          onCancel={() => closeSearch(newFile!)}
        >
          <Input
            value={value}
            ref={nodeRef}
            allowClear
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => handlerOnKeyDown(e)}
          />
        </Modal>
        <Modal
          title="提示"
          open={isOpen}
          footer={[
            <Button key={0} onClick={handlerCancel}>
              否
            </Button>,
            <Button
              key={1}
              type="primary"
              danger
              onClick={() => {
                onFileDelete(id!)
                handlerCancel()
              }}
            >
              是
            </Button>
          ]}
        >
          <div style={{ color: '#FC011A' }}>
            是否要删除
            <span style={{ fontSize: 18, fontWeight: 'bold', margin: '0 5px' }}>
              {title}.md
            </span>
            文件？
          </div>
        </Modal>
        {MessageContext}
      </>
    )
  })
)

type OmitType = Omit<FilesItemType, 'path'>

interface FileListPropsType {
  files: FilesItemType[]
  onFileClick: (id: string) => void
  onSaveEdit: (id: string, isNew: boolean, title: string) => void
  onFileDelete: (id: string) => void
}
