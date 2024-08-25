import classNames from 'classnames'
import { Flex } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import InjectObserver from './InjectObserver'
import { memo, useRef } from 'react'
import type { FilesType } from '../types'

export default memo(
  InjectObserver<TabListType>((props) => {
    const { openFiles, activeId, onTabClick, onCloseTab } = props
    const flexRef = useRef<HTMLDivElement | null>(null)

    const handleMousewheel = (e: {
      wheelDelta: number
      wheelDeltaX: number
      wheelDeltaY: number
      preventDefault: () => void
      deltaX: number
      deltaY: number
      deltaZ: number
      detail: number
    }) => {
      e.preventDefault()
      const delta = e.wheelDelta || e.deltaY
      flexRef.current!.scrollLeft += -Math.floor(delta / 2)
    }

    const handleOnMouseOverOrOnMouseout = (isShifIn: boolean) => {
      flexRef.current?.style.setProperty(
        '--scrollbar-height',
        `${isShifIn ? '5' : '0'}px`
      )
      if (flexRef.current!.scrollWidth > flexRef.current!.clientWidth) {
        flexRef.current![`${isShifIn ? 'add' : 'remove'}EventListener`](
          'mousewheel',
          handleMousewheel as any
        )
      }
    }

    const setScrollXLocation = (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
      flexRef.current?.scrollTo({
        left: (e.target as any as { offsetLeft: number }).offsetLeft,
        behavior: 'smooth'
      })
    }

    return (
      <div
        className="tab-list"
        onMouseEnter={() => handleOnMouseOverOrOnMouseout(true)}
        onMouseLeave={() => handleOnMouseOverOrOnMouseout(false)}
        ref={flexRef}
      >
        <Flex
          gap="small"
          className="nav nav-pills tablist-component"
          style={{
            flexWrap: 'nowrap'
          }}
        >
          {openFiles.map((file) => {
            return (
              <li key={file.id}>
                <a
                  href="#"
                  className={classNames({
                    'nav-link': true,
                    active: file.id === activeId,
                    withUnsaved: file.isUnSave
                  })}
                  onClick={(e) => {
                    e.preventDefault()
                    setScrollXLocation(e)
                    onTabClick(file.id)
                  }}
                >
                  {file.title}
                  <span
                    style={{ marginLeft: 10 }}
                    className="close-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseTab(file.id)
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </span>
                  {file.isUnSave && (
                    <span className="rounded-circle unsaved-icon"></span>
                  )}
                </a>
              </li>
            )
          })}
        </Flex>
      </div>
    )
  })
)

type TabListType = {
  openFiles: FilesType
  activeId: string
  onTabClick: (id: string) => void
  onCloseTab: (id: string) => void
}
