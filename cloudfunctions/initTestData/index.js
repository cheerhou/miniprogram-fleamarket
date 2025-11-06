// 云函数入口文件 - 初始化测试数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('开始初始化测试数据...')

    // 检查并创建 items 集合的测试数据
    const testItems = [
      {
        title: '小米音箱 Pro',
        description: '九成新小米音箱 Pro，功能完好，音质清晰。支持小爱同学语音控制，可以播放音乐、查询天气、设置闹钟等。原价299元，现价128元转让。包含原装充电器和说明书。',
        price: 128,
        condition: '9成新',
        category: '数码',
        location: '北区 3 栋大厅',
        images: [
          'https://tdesign.gtimg.com/miniprogram/images/swiper1.png',
          'https://tdesign.gtimg.com/miniprogram/images/swiper2.png'
        ],
        status: 'available',
        sellerName: '张三',
        sellerAvatar: '',
        publishTime: new Date(),
        viewCount: 12,
        lockInfo: null
      },
      {
        title: '美的空气炸锅',
        description: '八成新美的空气炸锅，3L容量，功能完好。支持无油烹饪，健康环保。使用次数不多，外观有轻微使用痕迹。原价399元，现价198元转让。',
        price: 198,
        condition: '8成新',
        category: '家居',
        location: '南区 5 栋大堂',
        images: [
          'https://tdesign.gtimg.com/miniprogram/images/swiper2.png',
          'https://tdesign.gtimg.com/miniprogram/images/swiper1.png'
        ],
        status: 'available',
        sellerName: '李四',
        sellerAvatar: '',
        publishTime: new Date(),
        viewCount: 5,
        lockInfo: null
      },
      {
        title: 'Ninebot 儿童滑板车',
        description: '七成新Ninebot儿童滑板车，适合3-8岁儿童。电池续航良好，充电器齐全。车身有轻微划痕，不影响使用。原价599元，现价299元转让。',
        price: 299,
        condition: '7成新',
        category: '童趣',
        location: '东区 3 栋',
        images: [
          'https://tdesign.gtimg.com/miniprogram/images/swiper1.png'
        ],
        status: 'available',
        sellerName: '王五',
        sellerAvatar: '',
        publishTime: new Date(),
        viewCount: 0,
        lockInfo: null
      }
    ]

    // 清空现有数据（可选）
    try {
      const existingItems = await db.collection('items').get()
      if (existingItems.data.length > 0) {
        console.log('items 集合已有数据，跳过初始化')
        return {
          success: true,
          message: '数据已存在，无需初始化'
        }
      }
    } catch (error) {
      console.log('检查现有数据时出错，继续初始化:', error.message)
    }

    // 插入测试数据
    for (const item of testItems) {
      try {
        const result = await db.collection('items').add({
          data: item
        })
        console.log(`添加物品成功: ${item.title}, ID: ${result._id}`)
      } catch (error) {
        console.error(`添加物品失败: ${item.title}`, error)
      }
    }

    console.log('测试数据初始化完成')

    return {
      success: true,
      message: '测试数据初始化成功',
      data: {
        insertedCount: testItems.length
      }
    }

  } catch (error) {
    console.error('初始化测试数据失败:', error)
    return {
      success: false,
      message: '初始化失败',
      error: error.message
    }
  }
}
