// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 上传图片到云存储
 * @param {Object} event - 事件参数
 * @param {Array} event.files - 要上传的文件数组
 * @param {string} event.folder - 存储文件夹名称
 * @returns {Object} 上传结果
 */
exports.main = async (event, context) => {
  const { files = [], folder = 'items' } = event
  
  try {
    const uploadResults = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 生成文件名：时间戳 + 随机数
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 1000)
      const fileName = `${folder}/${timestamp}_${random}_${file.name || `image_${i}.jpg`}`
      
      // 上传到云存储
      const uploadResult = await cloud.uploadFile({
        cloudPath: fileName,
        fileContent: file.data
      })
      
      // 获取文件下载链接
      const fileUrl = await cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })
      
      uploadResults.push({
        fileID: uploadResult.fileID,
        tempFileURL: fileUrl.fileList[0].tempFileURL,
        fileName: fileName
      })
    }
    
    return {
      success: true,
      data: uploadResults,
      message: '图片上传成功'
    }
    
  } catch (error) {
    console.error('图片上传失败:', error)
    return {
      success: false,
      error: error.message,
      message: '图片上传失败'
    }
  }
}
