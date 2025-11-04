// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 创建物品记录
 * @param {Object} event - 事件参数
 * @param {string} event.title - 物品标题
 * @param {string} event.description - 物品描述
 * @param {number} event.price - 物品价格
 * @param {string} event.condition - 物品成色
 * @param {string} event.category - 物品分类
 * @param {string} event.location - 交易地点
 * @param {Array} event.images - 图片URL数组
 * @returns {Object} 创建结果
 */
exports.main = async (event, context) => {
  const { 
    title, 
    description, 
    price, 
    condition, 
    category, 
    location, 
    images 
  } = event
  
  // 获取用户信息
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 数据验证
    if (!title || !description || !price || !location || !images || images.length === 0) {
      return {
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: '缺少必填字段'
      }
    }
    
    if (price <= 0) {
      return {
        success: false,
        error: 'INVALID_PRICE',
        message: '价格必须大于0'
      }
    }
    
    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户信息不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 生成物品ID
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 创建物品记录
    const itemData = {
      _id: itemId,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      condition: condition,
      category: category,
      location: location,
      images: images,
      status: 'available', // available, locked, sold
      sellerId: openid,
      sellerName: user.nickName || '用户',
      sellerAvatar: user.avatarUrl || '',
      publishTime: new Date(),
      updateTime: new Date(),
      viewCount: 0,
      lockInfo: null
    }
    
    const result = await db.collection('items').add({
      data: itemData
    })
    
    // 更新用户发布统计
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        publishCount: _.inc(1),
        lastPublishTime: new Date()
      }
    })
    
    return {
      success: true,
      data: {
        itemId: itemId,
        ...itemData
      },
      message: '物品发布成功'
    }
    
  } catch (error) {
    console.error('创建物品失败:', error)
    return {
      success: false,
      error: error.message,
      message: '物品发布失败'
    }
  }
}
