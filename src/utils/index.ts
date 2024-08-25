import dayjs from 'dayjs'
import type Fs from 'fs'
import type Path from 'path'

export { default as defaultFiles } from './defaultFiles'
export { default as ElSession } from './ElSession'
export { default as SettingsConfig } from './SettingsConfig'
export * from './defaultFiles'
export * from './helper'
export * from './node_utils'
export * from './handlerPathTransitionObj'
export { default as handlerPathTransitionObj } from './handlerPathTransitionObj'
export const fs: typeof Fs = window.electronApi.require('fs')
export const _path: typeof Path = window.electronApi.require('path')

export function debounce(fn: (...args: any[]) => void, delay: number = 500, immediate?: boolean): (...args: any[]) => void {
    immediate = immediate ?? false
    // 1. 定义一个定时器，保存上一次的定时器
    let timer: NodeJS.Timeout | null = null;
    let isInvoke = false;

    const _debounce = function (...args: []) {
        // 取消上一次的定时器
        if (timer) clearTimeout(timer);
        // 判断是否需要立即执行
        if (immediate && !isInvoke) {
            fn(...args)
            // fn.apply(this, args);
            isInvoke = true;
        } else {
            // 延迟执行
            timer = setTimeout(() => {
                // 外部传入的真正执行的函数
                // fn.apply(this, args);
                fn(...args)
                if (isInvoke) isInvoke = false;
                timer = null;
            }, delay);
        }
    };

    // 封装取消功能
    _debounce.cancel = function () {
        if (timer) clearTimeout(timer);
        timer = null;
        isInvoke = false;
    };
    return _debounce;
}

export const throttle = (fn: (...args: any[]) => void, delay: number = 500) => {
    let timer: NodeJS.Timeout | null = null
    delay = delay <= 500 ? 500 : delay >= 10000 ? 10000 : delay
    return function () {
        const args = arguments;
        if (timer) return;
        timer = setTimeout(() => {
            fn(args)
            timer = null;
        }, delay)
    }
}


export const filterArrFn = (target: string[], filterTarget: string[]) =>
    target.filter(fileName => !filterTarget.map(filterFileName => filterFileName.toLocaleLowerCase()).includes(fileName.toLocaleLowerCase()))

export const handlerFormat = (date?: dayjs.ConfigType) =>
    date ? dayjs(date ?? Date.now()).format('YYYY年MM月DD日 HH:mm:ss') : void 0

export const getFileDirPath = (path: string, slash: string) => path.toLocaleLowerCase().split(slash).slice(0, -1).join(slash)

export const findIndex = <T = string>(targetArr: T[], value: T) => targetArr.findIndex(_id => Object.is(_id, value))



