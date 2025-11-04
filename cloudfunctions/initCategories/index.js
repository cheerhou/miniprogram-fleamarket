// 云函数入口文件 - 初始化分类数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 初始化分类数据
exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    
    // 检查是否已有分类数据
    const existingCategories = await db.collection('categories').count()
    
    if (existingCategories.total > 0) {
      return {
        success: true,
        message: '分类数据已存在',
        data: {
          count: existingCategories.total
        }
      }
    }
    
    // 默认分类数据
    const defaultCategories = [
      {
        name: '童趣',
        icon: 'gift',
        description: '儿童玩具、绘本、童装等',
        status: 'active',
        isPopular: true,
        sort: 1,
        createTime: new Date()
      },
      {
        name: '数码',
        icon: 'mobile',
        description: '手机、电脑、数码配件等',
        status: 'active',
        isPopular: true,
        sort: 2,
        createTime: new Date()
      },
      {
        name: '手作',
        icon: 'edit',
        description: '手工艺品、DIY作品等',
        status: 'active',
        isPopular: false,
        sort: 3,
        createTime: new Date()
      },
      {
        name: '家居',
        icon: 'home',
        description: '家具、家电、装饰品等',
        status: 'active',
        isPopular: true,
        sort: 4,
        createTime: new Date()
      },
      {
        name: '运动',
        icon: 'heart',
        description: '运动器材、户外用品等',
        status: 'active',
        isPopular: false,
        sort: 5,
        createTime: new Date()
      },
      {
        name: '图书',
        icon: 'book',
        description: '图书、教材、文具等',
        status: 'active',
        isPopular: false,
        sort: 6,
        createTime: new Date()
      },
      {
        name: '美妆',
        icon: 'heart',
        description: '护肤品、化妆品等',
        status: 'active',
        isPopular: false,
        sort: 7,
        createTime: new Date()
      },
      {
        name: '其他',
        icon: 'more',
        description: '其他闲置物品',
        status: 'active',
        isPopular: false,
        sort: 8,
        createTime: new Date()
      }
    ]
    
    // 批量插入分类数据
    const result = await db.collection('categories').add({
      data: defaultCategories
    })
    
    return {
      success: true,
      message: '分类数据初始化成功',
      data: {
        insertedCount: defaultCategories.length,
        categories: defaultCategories
      }
    }
    
  } catch (error) {
    console.error('初始化分类数据失败:', error)
    return {
      success: false,
      message: '初始化分类数据失败',
      error: error.message
    }
  }
}
