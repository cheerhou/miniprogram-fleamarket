// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId } = event

  try {
    // 参数验证
    if (!itemId) {
      return {
        success: false,
        message: '物品ID不能为空'
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
    if (item.status !== 'available') {
      return {
        success: false,
        message: '物品不可锁定'
      }
    }

    // 检查是否已经被锁定
    if (item.lockInfo && item.lockInfo.lockedBy) {
      return {
        success: false,
        message: '物品已被锁定'
      }
    }

    // 计算锁定过期时间（12小时后）
    const now = new Date()
    const expireTime = new Date(now.getTime() + 12 * 60 * 60 * 1000)

    // 使用 db.command 来处理更新
    const _ = db.command

    // 更新物品状态为锁定
    await db.collection('items').doc(itemId).update({
      data: {
        status: 'locked',
        lockInfo: _.set({
          lockedBy: openid,
          lockTime: now,
          expireTime: expireTime
        }),
        updateTime: now
      }
    })

    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()

    let actorName = '用户'
    if (userResult.data.length > 0) {
      actorName = userResult.data[0].name || '用户'
    }

    return {
      success: true,
      message: '锁定成功',
      data: {
        itemId: itemId,
        lockTime: now,
        expireTime: expireTime,
        actorName: actorName
      }
    }

  } catch (error) {
    console.error('锁定物品失败:', error)
    return {
      success: false,
      message: '锁定失败，请重试',
      error: error.message
    }
  }
}
