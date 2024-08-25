import { v4 as uuidv4 } from 'uuid'
import { _path } from '.';
import { FilesItemType } from '../types'

export default function handlerPathTransitionObj(pathArr: string[]) {
    const tempObj: Record<string, FilesItemType> = {}
    pathArr.forEach(path => {
        const id = uuidv4()
        tempObj[id] = {
            id,
            path,
            title: getPathName(path),
            randomSuffix: '.' + id.split(/-/).at(-1)!
        }
    });
    return tempObj
}

export const getPathName = (path: string) => _path.basename(path, _path.extname(path))