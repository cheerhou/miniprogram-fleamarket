// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId, subscriptionId } = event

  try {
    // 参数验证
    if (!itemId && !subscriptionId) {
      return {
        success: false,
        message: '物品ID或订阅ID不能为空'
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

    let query = {
      userId: openid,
      status: 'active'
    }

    // 根据itemId或subscriptionId查询
    if (itemId) {
      query.itemId = itemId
    } else if (subscriptionId) {
      query._id = subscriptionId
    }

    // 查找订阅记录
    const subscriptionResult = await db.collection('item_subscriptions')
      .where(query)
      .get()

    if (subscriptionResult.data.length === 0) {
      return {
        success: false,
        message: '未找到订阅记录'
      }
    }

    const subscription = subscriptionResult.data[0]

    // 更新订阅状态为删除
    await db.collection('item_subscriptions').doc(subscription._id).update({
      data: {
        status: 'deleted',
        updateTime: new Date()
      }
    })

    // 更新物品的订阅数量
    await db.collection('items').doc(subscription.itemId).update({
      data: {
        subscribeCount: db.command.inc(-1),
        updateTime: new Date()
      }
    })

    return {
      success: true,
      message: '取消订阅成功',
      data: {
        subscriptionId: subscription._id,
        itemId: subscription.itemId
      }
    }

  } catch (error) {
    console.error('取消订阅失败:', error)
    return {
      success: false,
      message: '取消订阅失败，请重试',
      error: error.message
    }
  }
}
