export interface QinniuManagerInterface {
    new(accessKe: string, secretKey: string, bucket: string): void
    uploadFile(key: string, localFilePath: string): Promise<any>
    deleteFile(key: string): Promise<any>
    getBucketDomain(): Promise<any>
    getState(key: string): Promise<any>
    generateDownloadLink(key: string): Promise<any>
    downloadFile(key: string, downloadPath: string): Promise<any>
}