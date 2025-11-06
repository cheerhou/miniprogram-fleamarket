// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { notificationId, markAll } = event

  try {
    // 获取用户openid
    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        message: '用户信息获取失败'
      }
    }

    // 标记所有通知为已读
    if (markAll) {
      const result = await db.collection('notifications')
        .where({
          userId: openid,
          isRead: false
        })
        .update({
          data: {
            isRead: true,
            readTime: new Date()
          }
        })

      return {
        success: true,
        message: '标记所有通知为已读成功',
        data: {
          markedCount: result.stats.updated
        }
      }
    }

    // 标记单个通知为已读
    if (!notificationId) {
      return {
        success: false,
        message: '通知ID不能为空'
      }
    }

    // 查找通知记录
    const notificationResult = await db.collection('notifications')
      .where({
        _id: notificationId,
        userId: openid
      })
      .get()

    if (notificationResult.data.length === 0) {
      return {
        success: false,
        message: '通知不存在或无权限'
      }
    }

    const notification = notificationResult.data[0]

    // 如果已经是已读状态
    if (notification.isRead) {
      return {
        success: true,
        message: '通知已经是已读状态',
        data: {
          notificationId: notification._id,
          isRead: true
        }
      }
    }

    // 标记为已读
    await db.collection('notifications').doc(notificationId).update({
      data: {
        isRead: true,
        readTime: new Date()
      }
    })

    return {
      success: true,
      message: '标记已读成功',
      data: {
        notificationId: notification._id,
        isRead: true,
        readTime: new Date()
      }
    }

  } catch (error) {
    console.error('标记通知已读失败:', error)
    return {
      success: false,
      message: '标记已读失败，请重试',
      error: error.message
    }
  }
}
