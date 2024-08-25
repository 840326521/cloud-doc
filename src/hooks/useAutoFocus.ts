import { InputRef } from "antd"
import { useRef, useEffect } from "react"

export default function useAutoFocus() {
    const inputRef = useRef<InputRef>(null)
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [inputRef])
    return inputRef
}