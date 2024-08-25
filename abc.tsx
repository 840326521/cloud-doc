import { Modal } from 'antd'
import React from 'react'
import { ComponentType } from 'react'
import { Root, createRoot } from 'react-dom/client'

export interface ModalCmpBaseProps {
  onOk: (value?: any) => any
  onCancel: (error?: any) => any
}

export interface ModalConfig<D = unknown> {
  title?: string
  width?: number
  cmp: ComponentType<D & ModalCmpBaseProps>
  cmpProps?: Omit<D & ModalCmpBaseProps, 'onOk' | 'onCancel'>
}

export function openModal<R>(config: ModalConfig) {
  let ins: Root | undefined

  const ps = new Promise<R>((resolve, reject) => {
    const destroy = () => {
      if (ins) {
        ins.unmount()
        ins = undefined
      }
    }

    const onOk = (value: any) => {
      resolve(value)
      destroy()
    }

    const onCancel = (error: any) => {
      reject(error)
      destroy()
    }

    const frag = document.createDocumentFragment()

    ins = createRoot(frag)
    ins.render(
      <Modal
        open={true}
        title={config.title ?? '窗体'}
        footer={null}
        maskClosable={false}
        keyboard={false}
        onCancel={onCancel}
      >
        <config.cmp onOk={onOk} onCancel={onCancel} {...config.cmpProps} />
      </Modal>
    )
    document.body.appendChild(frag)
  })

  return ps
}
