export * from './Temp'
export * from './QinniuManagerInterface'

export type GetParentNodeType = <D = { id: string, title: string, path: string }>(node: any, parentClassName: string) => HTMLDivElement & { dataset: D } | null | undefined