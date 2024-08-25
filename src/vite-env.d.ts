/// <reference types="vite/client" />
declare module '*.cjs' {
    const statsRetrunType: {
        dev: number
        ino: number
        mode: number
        nlink: number
        uid: number
        gid: number
        rdev: number
        size: number
        blksize: number
        blocks: number
        atimeMs: number
        mtimeMs: number
        ctimeMs: number
        birthtimeMs: number
        atimeNs: number
        mtimeNs: number
        ctimeNs: number
        birthtimeNs: number
        atime: string
        mtime: string
        ctime: string
        birthtime: string
    }
    const src: {
        readFile: <D = any>(path: string) => Promise<D>
        writeFile: <D = any>(path: string, content: any) => Promise<D>
        renameFile: <D = any>(path: string, newPath: string) => Promise<D>
        deleteFile: <D = any>(path: string) => Promise<D>
        existsFile: <D = any>(path: string, isMkdir?: boolean) => Promise<D>
        mkdirFile: <D = any>(path: string) => Promise<D>
        stat: <D = any>(path: string) => Promise<D>
    }
    export default src
}
