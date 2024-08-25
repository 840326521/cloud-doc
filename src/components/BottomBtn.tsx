import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { memo } from 'react'
const BottomBtn = ({ text = '新建', disabled, colorClass, icon, onBtnClick }: BottomBtnType) => (
  <button
    className={`btn btn-block no-border ${colorClass}`}
    onClick={onBtnClick}
    style={{ width: '100%', color: 'white' }}
    disabled={disabled}
  >
    <FontAwesomeIcon
      style={{ marginRight: 5 }}
      icon={icon}
      size='lg'
    />
    {text}
  </button>
)

export default memo(BottomBtn)

type BottomBtnType = {
  text?: string
  colorClass: string
  icon: IconProp
  disabled?: boolean;
  onBtnClick?: () => void
}