import { DependencyList, useEffect, useRef } from "react";
import { getParentNode } from "../utils";
const { setContextMenus } = window.electronApi


export default function (itemArr: Array<{ label: string, click: () => void }>, targetSelector: string, deps: DependencyList) {
    let clickedElement = useRef<EventTarget | null>()
    useEffect(() => {
        return setContextMenus({
            itemArr,
            targetSelector,
            getParentNode,
            deps,
            callback: (targetElement) => clickedElement.current = targetElement
        })
    }, deps)
    return clickedElement
}