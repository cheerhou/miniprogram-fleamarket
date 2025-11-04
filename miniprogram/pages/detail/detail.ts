// detail.ts
import cloudUtils from '../../utils/cloud'

Page({
  data: {
    // 物品ID
    itemId: '',
    // 物品详情
    item: null as any,
    // 当前图片索引
    currentImageIndex: 0,
    // 加载状态
    loading: true,
    // 是否已锁定
    isLocked: false,
    // 是否已关注
    isFollowed: false
  },

  onLoad(options: any) {
    const { id } = options
    if (id) {
      this.setData({
        itemId: id
      })
      this.loadItemDetail(id)
    } else {
      wx.showToast({
        title: '物品ID不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载物品详情
  async loadItemDetail(id: string) {
    try {
      wx.showLoading({
        title: '加载中...'
      })

      // 先尝试从数据库获取真实数据
      try {
        const db = wx.cloud.database()
        const result = await db.collection('items').doc(id).get()
        
        if (result.data) {
          const item = result.data
          // 格式化数据
          const formattedItem = {
            _id: item._id,
            id: item._id,
            title: item.title,
            description: item.description,
            price: item.price,
            condition: item.condition,
            category: item.category,
            location: item.location,
            images: item.images || [],
            status: item.status || 'available',
            sellerName: item.sellerName || '用户',
            sellerAvatar: item.sellerAvatar || '',
            publishTime: this.formatDate(item.publishTime),
            viewCount: item.viewCount || 0,
            lockInfo: item.lockInfo || null
          }

          this.setData({
            item: formattedItem,
            loading: false
          })

          // 增加浏览量
          this.incrementViewCount(id)
          return
        }
      } catch (dbError) {
        console.log('从数据库获取失败，使用模拟数据:', dbError)
      }

      // 如果数据库获取失败，使用模拟数据
      const mockItems = {
        '1': {
          id: '1',
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
          publishTime: '2024-05-18 10:30',
          viewCount: 12,
          lockInfo: null
        },
        '2': {
          id: '2',
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
          status: 'locked',
          sellerName: '李四',
          sellerAvatar: '',
          publishTime: '2024-05-18 09:15',
          viewCount: 5,
          lockInfo: { lockTime: '2024-05-18 10:00', expireTime: '2024-05-18 22:00' }
        },
        '3': {
          id: '3',
          title: 'Ninebot 儿童滑板车',
          description: '七成新Ninebot儿童滑板车，适合3-8岁儿童。电池续航良好，充电器齐全。车身有轻微划痕，不影响使用。原价599元，现价299元转让。',
          price: 299,
          condition: '7成新',
          category: '童趣',
          location: '东区 3 栋',
          images: [
            'https://tdesign.gtimg.com/miniprogram/images/swiper1.png'
          ],
          status: 'sold',
          sellerName: '王五',
          sellerAvatar: '',
          publishTime: '2024-05-17 16:45',
          viewCount: 0,
          lockInfo: null
        }
      }

      const mockItem = mockItems[id as keyof typeof mockItems] || mockItems['1']

      this.setData({
        item: mockItem,
        loading: false
      })

      // 增加浏览量
      this.incrementViewCount(id)

    } catch (error) {
      console.error('加载物品详情失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 格式化日期
  formatDate(date: any) {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 增加浏览量
  async incrementViewCount(id: string) {
    try {
      // TODO: 调用云函数增加浏览量
      console.log('增加浏览量:', id)
    } catch (error) {
      console.error('增加浏览量失败:', error)
    }
  },

  // 图片轮播变化
  onSwiperChange(e: any) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  // 预览图片
  onPreviewImage() {
    const { item } = this.data
    if (item && item.images && item.images.length > 0) {
      wx.previewImage({
        current: item.images[this.data.currentImageIndex],
        urls: item.images
      })
    }
  },

  // 锁定物品
  onLockItem() {
    const { item, isLocked } = this.data
    
    if (isLocked) {
      wx.showToast({
        title: '您已锁定该物品',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认锁定',
      content: '锁定后将为您保留 12 小时，请在锁定期内完成支付',
      confirmText: '确认锁定',
      success: (res) => {
        if (res.confirm) {
          this.lockItem()
        }
      }
    })
  },

  // 执行锁定
  async lockItem() {
    try {
      wx.showLoading({
        title: '锁定中...'
      })

      // TODO: 调用云函数锁定物品
      console.log('锁定物品:', this.data.itemId)

      this.setData({
        isLocked: true
      })

      wx.showToast({
        title: '锁定成功',
        icon: 'success'
      })

    } catch (error) {
      console.error('锁定失败:', error)
      wx.showToast({
        title: '锁定失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 关注物品
  onFollowItem() {
    const { isFollowed } = this.data
    
    if (isFollowed) {
      this.unfollowItem()
    } else {
      this.followItem()
    }
  },

  // 关注
  async followItem() {
    try {
      // TODO: 调用云函数关注物品
      console.log('关注物品:', this.data.itemId)

      this.setData({
        isFollowed: true
      })

      wx.showToast({
        title: '关注成功',
        icon: 'success'
      })

    } catch (error) {
      console.error('关注失败:', error)
      wx.showToast({
        title: '关注失败，请重试',
        icon: 'none'
      })
    }
  },

  // 取消关注
  async unfollowItem() {
    try {
      // TODO: 调用云函数取消关注
      console.log('取消关注物品:', this.data.itemId)

      this.setData({
        isFollowed: false
      })

      wx.showToast({
        title: '已取消关注',
        icon: 'success'
      })

    } catch (error) {
      console.error('取消关注失败:', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    }
  },

  // 联系卖家
  onContactSeller() {
    wx.showModal({
      title: '联系卖家',
      content: '您确定要联系卖家吗？',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          // TODO: 实现联系卖家功能
          wx.showToast({
            title: '联系功能开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  // 分享
  onShare() {
    wx.showActionSheet({
      itemList: ['分享给微信好友', '生成海报'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.onShareAppMessage()
        } else if (res.tapIndex === 1) {
          wx.showToast({
            title: '海报生成开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  // 分享到微信
  onShareAppMessage() {
    const { item } = this.data
    return {
      title: item ? `${item.title} - ¥${item.price}` : '社区二手市场',
      path: `/pages/detail/detail?id=${this.data.itemId}`,
      imageUrl: item && item.images.length > 0 ? item.images[0] : ''
    }
  }
})
