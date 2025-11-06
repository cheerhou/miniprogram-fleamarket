// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { page = 1, pageSize = 20, type, isRead } = event

  try {
    // 获取用户openid
    const openid = wxContext.OPENID
    if (!openid) {
      return {
        success: false,
        message: '用户信息获取失败'
      }
    }

    // 构建查询条件
    let query = {
      userId: openid
    }

    // 按类型筛选
    if (type) {
      query.type = type
    }

    // 按已读状态筛选
    if (isRead !== undefined) {
      query.isRead = isRead === 'true'
    }

    // 计算跳过的数量
    const skip = (page - 1) * pageSize

    // 查询通知列表
    const notificationsResult = await db.collection('notifications')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    const notifications = notificationsResult.data

    // 获取物品信息（用于显示）
    const itemIds = [...new Set(notifications.map(n => n.itemId))]
    let itemsMap = {}
    
    if (itemIds.length > 0) {
      const itemsResult = await db.collection('items')
        .where({
          _id: db.command.in(itemIds)
        })
        .field({
          _id: true,
          title: true,
          images: true,
          price: true,
          status: true
        })
        .get()

      itemsMap = itemsResult.data.reduce((map, item) => {
        map[item._id] = item
        return map
      }, {})
    }

    // 组装返回数据
    const notificationList = notifications.map(notification => ({
      ...notification,
      item: itemsMap[notification.itemId] || null
    }))

    // 查询总数
    const countResult = await db.collection('notifications')
      .where(query)
      .count()

    const total = countResult.total

    // 计算未读数量
    const unreadCountResult = await db.collection('notifications')
      .where({
        userId: openid,
        isRead: false
      })
      .count()

    const unreadCount = unreadCountResult.total

    return {
      success: true,
      message: '获取通知列表成功',
      data: {
        list: notificationList,
        total,
        page,
        pageSize,
        unreadCount,
        hasMore: skip + notifications.length < total
      }
    }

  } catch (error) {
    console.error('获取通知列表失败:', error)
    return {
      success: false,
      message: '获取通知列表失败，请重试',
      error: error.message
    }
  }
}
