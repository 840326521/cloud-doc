export interface TempInterface {
    session: TempType
    name?: string
    get: (name: string) => TempType
    set: (name: string, value: string) => void
    remove: (name: string) => void
}

export type TempType = Record<string, { value: string, isRefresh: boolean }>