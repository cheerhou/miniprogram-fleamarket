// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 20

/**
 * 获取物品列表
 * @param {Object} event - 事件参数
 * @param {number} event.page - 页码，从1开始
 * @param {number} event.pageSize - 每页数量，默认20
 * @param {string} event.category - 分类筛选
 * @param {string} event.status - 状态筛选
 * @param {string} event.keyword - 关键词搜索
 * @param {string} event.sortBy - 排序方式：time(时间)、price(价格)
 * @returns {Object} 查询结果
 */
exports.main = async (event, context) => {
  const { 
    page = 1, 
    pageSize = MAX_LIMIT, 
    category, 
    status, 
    keyword,
    sortBy = 'time'
  } = event
  
  try {
    // 构建查询条件
    let whereCondition = {}
    
    // 分类筛选（根据分类名称筛选）
    if (category && category !== '全部') {
      whereCondition.category = category
    }
    
    if (status) {
      whereCondition.status = status
    }
    
    if (keyword && keyword.trim()) {
      // 使用正则表达式进行模糊搜索
      whereCondition.title = db.RegExp({
        regexp: keyword.trim(),
        options: 'i' // 不区分大小写
      })
    }
    
    // 计算跳过的数量
    const skip = (page - 1) * pageSize
    
    // 构建查询
    let query = db.collection('items').where(whereCondition)
    
    // 根据排序方式设置排序
    if (sortBy === 'price') {
      query = query.orderBy('price', 'asc') // 价格从低到高
    } else {
      query = query.orderBy('publishTime', 'desc') // 时间从新到旧
    }
    
    // 查询物品列表
    const result = await query
      .skip(skip)
      .limit(pageSize)
      .get()
    
    // 获取总数（用于分页）
    const countResult = await db.collection('items')
      .where(whereCondition)
      .count()
    
    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(countResult.total / pageSize),
        hasMore: skip + result.data.length < countResult.total
      },
      message: '获取成功'
    }
    
  } catch (error) {
    console.error('获取物品列表失败:', error)
    return {
      success: false,
      error: error.message,
      message: '获取物品列表失败'
    }
  }
}
