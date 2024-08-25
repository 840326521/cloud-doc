import { useState, useEffect, useRef, memo } from 'react'
import { Button, Input, InputRef } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faClose } from '@fortawesome/free-solid-svg-icons'
import useKeyPress from '../hooks/useKeyPress'

const FileSearch = ({ title = '我的云文档', onFileSearch }: { title?: string, onFileSearch: (value: string) => void }) => {
  const [inputActive, setInputActive] = useState(false)
  const [value, setValue] = useState('')
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)
  let nodeRef = useRef<InputRef>(null)

  const closeSearch = () => {
    setInputActive(!inputActive)
    if (!inputActive) setValue('')
    onFileSearch('')
  }

  useEffect(() => {
    if (inputActive) {
      if (enterPressed) {
        onFileSearch(value)
      } else if (escPressed) {
        closeSearch()
      }
    }
  })

  useEffect(() => {
    if (inputActive) {
      nodeRef.current?.focus();
    }
  }, [inputActive])

  return (
    <div
      className='alert alert-primary d-flex justify-content-between align-items-center mb-0'
      style={{ borderRadius: 0 }}
    >
      {
        !inputActive ?
          <span>{title}</span>
          :
          <Input
            allowClear
            ref={nodeRef}
            value={value}
            onChange={e => setValue(e.target.value)}
          />
      }
      <Button
        type='ghost'
        onClick={closeSearch}
      >
        <FontAwesomeIcon
          title={!inputActive ? '搜索' : '关闭'}
          size='lg'
          icon={!inputActive ? faSearch : faClose}
        />
      </Button>
    </div>
  )
}

export default memo(FileSearch);