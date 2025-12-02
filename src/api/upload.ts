import { UPLOAD_URL } from './commonApi';
import request from './request'

/**
 * 上传头像
 * @param {File} file 文件
 * @returns promise
 */
function uploadAvatar(file: File) {
    let formData = new FormData();
    formData.append("file", file)

    return request({
        url: UPLOAD_URL,
        method: "post",
        data: formData,
    })

}

export { uploadAvatar }