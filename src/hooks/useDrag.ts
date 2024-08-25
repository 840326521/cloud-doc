import { useCallback, useEffect, useState } from "react";

const supportSuffixList = ['.html', '.md', '.json']

export default function useDrag(addFileList: (filePaths: string[]) => void): [boolean, string[]] {
    const [isShowFileHint, setIsShowFIleHInt] = useState(false)
    const dragApiDict = {
        /**
         * 在拖拽事件中遇到目标元素 ondrop 事件没有效果
         */
        dragover(e: DragEvent) {
            e.preventDefault()
            e.stopPropagation()
        },
        /**
         * 目标对象被源对象拖动着悬停在上方
         */
        dragenter: (e: DragEvent) => {
            if (isShowFileHint) return
            setIsShowFIleHInt(true)
        },
        /**
         * 源对象拖动着离开了目标对象
         */
        dragleave(e: DragEvent) {
            if (e.x <= 0 && e.y <= 0) {
                setIsShowFIleHInt(false)
            }
        },
        drop(e: DragEvent) {
            const files = e.dataTransfer?.files!;
            console.log(e)
            if (files.length > 0) {
                console.log(files)
                console.log('files:', [...files].filter(item => supportSuffixList.includes(`.${item.name.split('.').at(-1)!}`)).map(item => item.path))
            }
            setIsShowFIleHInt(false)
        },
    }
    const toggleEventListener = (fnName: 'add' | 'remove') => {
        (Object.keys(dragApiDict) as Array<keyof typeof dragApiDict>).forEach(key => {
            window[`${fnName}EventListener`](key, e => {
                dragApiDict[key](e as DragEvent)
            })
        })
    }
    useEffect(() => {
        toggleEventListener('add')
        return () => {
            toggleEventListener('remove')
        }
    }, [])
    return [isShowFileHint, supportSuffixList]
}