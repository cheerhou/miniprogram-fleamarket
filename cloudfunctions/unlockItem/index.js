// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId, action } = event

  try {
    // 参数验证
    if (!itemId) {
      return {
        success: false,
        message: '物品ID不能为空'
      }
    }

    if (!action || !['release', 'sell'].includes(action)) {
      return {
        success: false,
        message: '操作类型无效'
      }
    }

    // 获取用户openid
    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        message: '用户信息获取失败'
      }
    }

    // 获取物品信息
    const itemResult = await db.collection('items').doc(itemId).get()
    if (!itemResult.data) {
      return {
        success: false,
        message: '物品不存在'
      }
    }

    const item = itemResult.data

    // 检查物品状态
    if (item.status !== 'locked') {
      return {
        success: false,
        message: '物品状态不正确'
      }
    }

    // 检查是否为锁定者
    if (!item.lockInfo || item.lockInfo.lockedBy !== openid) {
      return {
        success: false,
        message: '无权限操作此物品'
      }
    }

    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()

    let actorName = '用户'
    if (userResult.data.length > 0) {
      actorName = userResult.data[0].name || '用户'
    }

    let newStatus, notificationType, notificationTitle

    if (action === 'release') {
      // 释放物品
      newStatus = 'available'
      notificationType = 'item_released'
      notificationTitle = '物品已释放'
    } else if (action === 'sell') {
      // 售出物品
      newStatus = 'sold'
      notificationType = 'item_sold'
      notificationTitle = '物品已售出'
    }

    // 更新物品状态
    await db.collection('items').doc(itemId).update({
      data: {
        status: newStatus,
        lockInfo: null,
        updateTime: new Date()
      }
    })

    // 发送通知给订阅者
    try {
      const notificationResult = await cloud.callFunction({
        name: 'sendItemNotification',
        data: {
          itemId: itemId,
          type: notificationType,
          actorId: openid,
          actorName: actorName
        }
      })
      
      console.log('通知发送结果:', notificationResult.result)
    } catch (notifyError) {
      console.error('发送通知失败:', notifyError)
    }

    return {
      success: true,
      message: action === 'release' ? '释放成功' : '售出成功',
      data: {
        itemId: itemId,
        status: newStatus,
        action: action,
        actorName: actorName
      }
    }

  } catch (error) {
    console.error('操作物品失败:', error)
    return {
      success: false,
      message: '操作失败，请重试',
      error: error.message
    }
  }
}
