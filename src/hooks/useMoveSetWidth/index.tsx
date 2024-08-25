import './index.less'
import {
  CSSProperties,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react'

const useMoveSetWidth = (
  settingsStore: ReturnType<Window['electronApi']['getSettingsStore']>,
  propsMinDragWidth: number = 268
) => {
  const rightResizeRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const initState: StateType = {
    isPress: false,
    totalDistance: 0,
    moveStartX: 0,
    currentDomWidth: settingsStore.get('currentDomWidth', propsMinDragWidth),
    maxDragWidth: 0
  }
  const [hasUpdated, setHasUpdated] = useState(false)

  // const calculateDistance = (x: number, y: number) =>
  //   Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))

  const reducer = (state: StateType, action: ActionType): StateType => {
    switch (action.type) {
      case 'setIsPress':
        return {
          ...state,
          isPress: action.formData.isPress!
        }
      case 'setTotalDistance':
        return {
          ...state,
          totalDistance: action.formData.totalDistance!
        }
      case 'setMoveStartX':
        return {
          ...state,
          moveStartX: action.formData.moveStartX!
        }
      case 'setCurrentDomWidth':
        console.log('走到这了：setCurrentDomWidth')

        return {
          ...state,
          currentDomWidth: action.formData.currentDomWidth!
        }
      case 'setMaxDragWidth':
        console.log('走到这了：setMaxDragWidth')

        return {
          ...state,
          maxDragWidth: action.formData.maxDragWidth!
        }
    }
  }

  const [recordMoveStatusValue, dispatch] = useReducer(reducer, initState)

  /**
   * 鼠标按下
   * */
  const handleOnMouseDownEvent: React.MouseEventHandler<HTMLDivElement> = (
    e
  ) => {
    handleOnMouseDownAndOnMouseUpEvent(true)
    // dispatch({
    //   type: 'setCurrentDomWidth',
    //   formData: { currentDomWidth: parentRef.current!.offsetWidth }
    // })
    dispatch({
      type: 'setMoveStartX',
      formData: { moveStartX: e.clientX }
    })
  }

  /**
   * 鼠标抬起
   */
  const handleOnMouseUpEvent: React.MouseEventHandler<HTMLDivElement> = () => {
    handleOnMouseDownAndOnMouseUpEvent(false)
  }

  const getDoms = () => {
    const currentDom = parentRef.current!
    const [bodyDom, brotherDom] = [document.body, currentDom!.nextSibling!]

    return {
      currentDom,
      bodyDom,
      brotherDom
    }
  }

  const handleOnMouseDownAndOnMouseUpEvent = (isPress: boolean) => {
    dispatch({ type: 'setIsPress', formData: { isPress } })
    document.body.style.setProperty('cursor', isPress ? 'ew-resize' : 'default')
    document.body.style.setProperty(
      '--body-before-size',
      `${isPress ? 100 : 0}%`
    )
  }

  const addEventListener = <T extends keyof GlobalEventHandlersEventMap>(
    type: T,
    callback: (e: DocumentEventMap[T]) => void
  ) => {
    document.addEventListener(type, callback)
    return () => document.removeEventListener(type, callback)
  }

  const setPropertys: <T extends HTMLDivElement>(
    setDomStylesList: Array<{ dom: T; cssProperty: CSSProperties }>
  ) => void = (setDomStylesList) => {
    setDomStylesList.forEach(({ dom, cssProperty }) => {
      ;(Object.keys(cssProperty) as Array<keyof CSSProperties>).forEach((key) =>
        dom.style.setProperty(key, cssProperty[key] as string)
      )
    })
  }

  const setMinDragWidthAndMaxDragWidth = (
    options: Pick<StateType, 'currentDomWidth' | 'maxDragWidth'>
  ) => {
    const optionsKeyList = Object.keys(options) as Array<keyof typeof options>
    console.log('options:', options)
    optionsKeyList.forEach((key) => {
      console.log('key:', {
        type: `set${key.replace(
          key[0],
          key[0].toUpperCase()
        )}` as `set${Capitalize<typeof key>}`,
        formData: { [key]: options[key] }
      })
      dispatch({
        type: `set${key.replace(
          key[0],
          key[0].toUpperCase()
        )}` as `set${Capitalize<typeof key>}`,
        formData: { [key]: options[key] }
      })
    })
    setHasUpdated(false)
  }

  const setDomWidth = (e?: MouseEvent) => {
    const { bodyDom, currentDom, brotherDom } = getDoms()
    e && e.preventDefault()
    console.log('recordMoveStatusValue:', recordMoveStatusValue)
    const { currentDomWidth, moveStartX, maxDragWidth } = recordMoveStatusValue
    console.log('maxDragWidth:', maxDragWidth)
    let newDragWidth =
      e && e.movementX ? e.clientX + moveStartX : currentDomWidth
    console.log('newDragWidth:', newDragWidth)

    if (newDragWidth < propsMinDragWidth) {
      newDragWidth = propsMinDragWidth
      console.log('小于 newDragWidth:', newDragWidth)
    } else if (newDragWidth > maxDragWidth) {
      newDragWidth = maxDragWidth
      console.log('大于 newDragWidth:', newDragWidth)
    }
    const newRightSimpleMdeWidth = Math.floor(
      bodyDom!.offsetWidth - newDragWidth
    )
    console.log('newDragWidth:', newDragWidth)
    console.log('newRightSimpleMdeWidth:', newRightSimpleMdeWidth)

    setPropertys([
      {
        dom: currentDom,
        cssProperty: {
          width: `${newDragWidth}px`,
          flex: `0 0 ${newDragWidth}px`
        }
      },
      {
        dom: brotherDom as HTMLDivElement,
        cssProperty: {
          width: `${newRightSimpleMdeWidth}px`,
          flex: `0 0 ${newRightSimpleMdeWidth}px`
        }
      }
    ])
    e && settingsStore.set('currentDomWidth', newDragWidth)
  }

  useEffect(() => {
    return addEventListener('mouseup', () => {
      handleOnMouseDownAndOnMouseUpEvent(false)
    })
  }, [])

  const getMinAndMaxWidthThreshold = () => {
    const {
      bodyDom: { offsetWidth: body_width }
    } = getDoms()
    const minDragWidth = Math.floor(body_width * 0.2)
    let currentDomWidth = settingsStore.get('currentDomWidth', minDragWidth)
    const maxDragWidth = body_width - currentDomWidth
    return {
      currentDomWidth,
      maxDragWidth: maxDragWidth < minDragWidth ? minDragWidth : maxDragWidth
    }
  }

  const resizeCallback: <K extends keyof WindowEventMap = 'resize'>(
    e?: WindowEventMap[K]
  ) => void = (e) => {
    setMinDragWidthAndMaxDragWidth(getMinAndMaxWidthThreshold())
    setDomWidth(e as MouseEvent)
  }

  useEffect(() => {
    setHasUpdated(true)
  }, [
    recordMoveStatusValue.currentDomWidth,
    recordMoveStatusValue.maxDragWidth
  ])

  useEffect(() => {
    resizeCallback()
    return addEventListener('resize', resizeCallback)
  }, [hasUpdated])

  useEffect(() => {
    if (recordMoveStatusValue.isPress) {
      return addEventListener('mousemove', setDomWidth)
    }
  }, [recordMoveStatusValue.isPress])

  return {
    parentRef,
    isPress: recordMoveStatusValue.isPress,
    MoveSetParrentWidth: () => (
      <div
        ref={rightResizeRef}
        className="left-panel-right-resize"
        onMouseDown={handleOnMouseDownEvent}
        onMouseUp={handleOnMouseUpEvent}
        style={{
          backgroundColor: recordMoveStatusValue.isPress
            ? getComputedStyle(rightResizeRef.current!).getPropertyValue(
                '--left-panel-right-resize-background-color'
              )
            : ''
        }}
      ></div>
    )
  }
}

type StateType = {
  isPress: boolean
  totalDistance: number
  moveStartX: number
  currentDomWidth: number
  maxDragWidth: number
}

type ActionType = {
  type: `set${Capitalize<keyof StateType>}`
  formData: Partial<StateType>
}

export default useMoveSetWidth
