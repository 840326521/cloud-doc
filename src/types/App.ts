import { FilesItemType, TempType } from "."

export interface StateType {
    newFile?: {
        isDel?: boolean
        value?: Omit<FilesItemType, 'path'>
    }
    isShow?: boolean,
}

export interface ActionType {
    type: keyof typeof ActionTypeEnum,
    payload: StateType
}

export enum ActionTypeEnum {
    SET_IS_SHOW = 'SET_IS_SHOW',
    /** 设置新的文件 */
    SET_NEW_FILE = 'SET_NEW_FILE',
}

export enum ElSessionEnum {
    TEMP_CONTENT = 'TEMP_CONTENT',
}

export type TabListRefType = {
    updateTempContentObj(session: TempType): void
}