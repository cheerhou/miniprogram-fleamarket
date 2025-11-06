// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId, type, actorId, actorName } = event

  try {
    // 参数验证
    if (!itemId || !type || !actorId) {
      return {
        success: false,
        message: '参数不完整'
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

    // 获取该物品的所有订阅者
    const subscribersResult = await db.collection('item_subscriptions')
      .where({
        itemId: itemId,
        status: 'active'
      })
      .get()

    const subscribers = subscribersResult.data

    if (subscribers.length === 0) {
      return {
        success: true,
        message: '暂无订阅者',
        data: {
          notifyCount: 0
        }
      }
    }

    // 根据通知类型生成通知内容
    let title, content
    switch (type) {
      case 'item_released':
        title = '物品已释放'
        content = `您关注的物品"${item.title}"已释放，可立即购买`
        break
      case 'item_sold':
        title = '物品已售出'
        content = `您关注的物品"${item.title}"已售出`
        break
      default:
        title = '物品状态更新'
        content = `您关注的物品"${item.title}"状态已更新`
    }

    // 批量创建通知
    const notifications = subscribers.map(subscriber => ({
      userId: subscriber.userId,
      itemId: itemId,
      type: type,
      actorId: actorId,
      actorName: actorName || '用户',
      title: title,
      content: content,
      isRead: false,
      createTime: new Date()
    }))

    // 批量插入通知
    const notificationResult = await db.collection('notifications').add({
      data: notifications
    })

    // 更新订阅者的最后通知时间和通知次数
    const updatePromises = subscribers.map(subscriber => 
      db.collection('item_subscriptions').doc(subscriber._id).update({
        data: {
          lastNotifyTime: new Date(),
          notifyCount: db.command.inc(1),
          updateTime: new Date()
        }
      })
    )

    await Promise.all(updatePromises)

    // 发送微信订阅消息（如果需要）
    try {
      // 这里可以集成微信订阅消息发送
      // await sendWechatSubscribeMessage(subscribers, title, content, item)
    } catch (error) {
      console.warn('发送微信订阅消息失败:', error)
    }

    return {
      success: true,
      message: '通知发送成功',
      data: {
        notifyCount: subscribers.length,
        title: title,
        content: content
      }
    }

  } catch (error) {
    console.error('发送物品通知失败:', error)
    return {
      success: false,
      message: '发送通知失败，请重试',
      error: error.message
    }
  }
}

// 发送微信订阅消息的辅助函数（可选实现）
async function sendWechatSubscribeMessage(subscribers, title, content, item) {
  // 这里可以实现微信订阅消息的发送逻辑
  // 需要用户的订阅消息授权
  const promises = subscribers.map(subscriber => {
    return cloud.openapi.subscribeMessage.send({
      touser: subscriber.userId,
      template_id: 'your_template_id', // 需要配置模板ID
      page: `/pages/detail/detail?id=${item._id}`,
      data: {
        thing1: { value: item.title },
        thing2: { value: content },
        time3: { value: new Date().toLocaleString() }
      }
    })
  })

  return Promise.all(promises)
}
