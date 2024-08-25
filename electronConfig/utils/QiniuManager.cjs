const axios = require('axios')
const qiniu = require('qiniu')
const fs = require('fs')

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        //  generate mac
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.bucket = bucket

        // init config class
        this.config = new qiniu.conf.Config();
        // 空间对应的机房
        this.config.zone = qiniu.zone.Zone_z0;
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }
    uploadFile(key, localFilePath) {
        const options = {
            scope: `${this.bucket}:${key}`
        }
        const putPolicy = new qiniu.rs.PutPolicy(options)
        const uploadToken = putPolicy.uploadToken(this.mac)
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();
        return new Promise((resolve, reject) => {
            // 文件上传
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handlerCallback(resolve, reject));
        })
    }
    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handlerCallback(resolve, reject))
        })
    }
    getBucketDomain() {
        const reqURL = `HTTP://uc.qiniuapi.com/v2/domains?tbl=${this.bucket}`
        const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, digest, this._handlerCallback(resolve, reject))
        })
    }
    getState(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.stat(this.bucket, key, this._handlerCallback(resolve, reject))
        })
    }
    generateDownloadLink(key) {
        const domainPromise = this.publicBucketDomain ?
            Promise.resolve([this.publicBucketDomain]) :
            this.getBucketDomain()
        return domainPromise.then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const pattern = /^https?/
                this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data[0]}`
                return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key)
            } else {
                throw Error('域名未找到，请查看存储空间是否过期')
            }
        })
    }
    downloadFile(key, downloadPath) {
        // step 1 get the download link
        return this.generateDownloadLink(key).then(link => {
            // step 2 send the request to download link, return a readable stream
            const timeStamp = Date.now()
            const url = `${link}?timestamp=${timeStamp}`
            return axios({
                url,
                method: 'GET',
                responseType: 'stream',
                headers: { 'Cache-Control': 'no-cache' }
            }).then(response => {
                const writer = fs.createWriteStream(downloadPath)
                response.data.pipe(writer)
                return new Promise((resolve, reject) => {
                    writer.on('finish', resolve)
                    writer.on('error', reject)
                })
            }).catch((err) => Promise.reject({ err: err.response }))
        })

        // step 3 create a writable stream and pipe to it

        // step 4 return a promise based result
    }
    _handlerCallback(resolve, reject) {
        return (respErr, respBody, respInfo) => {
            if (respErr) {
                throw respErr;
            }
            if (respInfo.statusCode === 200) {
                resolve(respBody);
            } else {
                reject({
                    statusCode: respInfo.statusCode,
                    body: respBody
                })
            }
        }
    }
}

module.exports = QiniuManager