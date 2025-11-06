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

    // 检查物品是否存在且状态为锁定
    const itemResult = await db.collection('items').doc(itemId).get()
    if (!itemResult.data) {
      return {
        success: false,
        message: '物品不存在'
      }
    }

    const item = itemResult.data
    if (item.status !== 'locked') {
      return {
        success: false,
        message: '只能订阅已锁定的物品'
      }
    }

    // 检查是否已经订阅
    const existingSubscription = await db.collection('item_subscriptions')
      .where({
        userId: openid,
        itemId: itemId,
        status: 'active'
      })
      .get()

    if (existingSubscription.data.length > 0) {
      return {
        success: false,
        message: '您已经订阅了该物品'
      }
    }

    // 创建订阅记录
    const subscriptionData = {
      userId: openid,
      itemId: itemId,
      sellerId: item.userId || item.sellerId,
      itemStatus: item.status,
      status: 'active',
      createTime: new Date(),
      lastNotifyTime: null,
      notifyCount: 0
    }

    const subscriptionResult = await db.collection('item_subscriptions').add({
      data: subscriptionData
    })

    // 更新物品的订阅数量
    await db.collection('items').doc(itemId).update({
      data: {
        subscribeCount: db.command.inc(1),
        updateTime: new Date()
      }
    })

    return {
      success: true,
      message: '订阅成功',
      data: {
        subscriptionId: subscriptionResult._id,
        ...subscriptionData
      }
    }

  } catch (error) {
    console.error('订阅物品失败:', error)
    return {
      success: false,
      message: '订阅失败，请重试',
      error: error.message
    }
  }
}
