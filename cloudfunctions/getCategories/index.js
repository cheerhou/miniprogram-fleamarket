// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取分类列表
exports.main = async (event, context) => {
  try {
    const { type } = event // 可选参数：all, active, popular
    
    const db = cloud.database()
    const _ = db.command
    
    let query = {}
    
    // 根据类型筛选
    if (type === 'active') {
      query = {
        status: 'active'
      }
    } else if (type === 'popular') {
      query = {
        isPopular: true,
        status: 'active'
      }
    }
    
    // 获取分类列表
    let result
    try {
      result = await db.collection('categories')
        .where(query)
        .orderBy('sort', 'asc')
        .orderBy('createTime', 'desc')
        .get()
    } catch (error) {
      console.error('获取分类列表失败:', error)
      // 如果集合不存在，返回默认分类数据
      const defaultCategories = [
        { _id: '1', name: '童趣', icon: 'gift', description: '儿童玩具、绘本、童装等', itemCount: 0 },
        { _id: '2', name: '数码', icon: 'mobile', description: '手机、电脑、数码配件等', itemCount: 0 },
        { _id: '3', name: '手作', icon: 'edit', description: '手工艺品、DIY作品等', itemCount: 0 },
        { _id: '4', name: '家居', icon: 'home', description: '家具、家电、装饰品等', itemCount: 0 },
        { _id: '5', name: '运动', icon: 'heart', description: '运动器材、户外用品等', itemCount: 0 },
        { _id: '6', name: '图书', icon: 'book', description: '图书、教材、文具等', itemCount: 0 },
        { _id: '7', name: '美妆', icon: 'heart', description: '护肤品、化妆品等', itemCount: 0 },
        { _id: '8', name: '其他', icon: 'more', description: '其他闲置物品', itemCount: 0 }
      ]
      
      return {
        success: true,
        data: {
          list: defaultCategories,
          total: defaultCategories.length
        }
      }
    }
    
    // 统计每个分类的物品数量
    const categoriesWithCount = await Promise.all(
      result.data.map(async (category) => {
        let itemCount = 0
        try {
          const countResult = await db.collection('items')
            .where({
              categoryId: category.name,
              status: 'available'
            })
            .count()
          itemCount = countResult.total || 0
        } catch (error) {
          console.error('统计物品数量失败:', error)
          itemCount = 0
        }
        
        return {
          ...category,
          itemCount
        }
      })
    )
    
    return {
      success: true,
      data: {
        list: categoriesWithCount,
        total: categoriesWithCount.length
      }
    }
    
  } catch (error) {
    console.error('获取分类失败:', error)
    return {
      success: false,
      message: '获取分类失败',
      error: error.message
    }
  }
}
