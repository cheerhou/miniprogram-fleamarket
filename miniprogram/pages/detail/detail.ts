// miniprogram/pages/detail/detail.ts
interface ItemDetail {
  id: string
  title: string
  description: string
  price: number
  condition: string
  category: string
  location: string
  images: string[]
  status: 'available' | 'locked' | 'sold'
  sellerId: string
  sellerName: string
  sellerAvatar: string
  publishTime: string
  lockInfo?: {
    lockUserId: string
    lockUserName: string
    lockTime: string
    expireTime: string
  }
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createTime: string
  isSeller?: boolean
  replyTo?: string
}

Page({
  data: {
    // 物品详情
    item: null as ItemDetail | null,
    
    // 图片轮播
    currentImageIndex: 0,
    
    // 用户操作状态
    isFavorited: false,
    isSubscribed: false,
    
    // 留言相关
    comments: [] as Comment[],
    commentInput: '',
    
    // 锁定倒计时
    lockCountdown: '',
    
    // 页面状态
    loading: true,
    
    // 模拟数据
    mockItem: {
      id: '1',
      title: '小米音箱 Pro',
      description: '自用小米音箱 Pro，一直放在客厅，音质很好，支持小爱同学语音控制，可连接蓝牙、Wi-Fi。机身无刮痕，出货前会进行清洁并附赠备用电源线。',
      price: 128,
      condition: '9成新',
      category: '智能设备',
      location: '北区 3 栋大厅',
      images: [
        '/images/item1-1.jpg',
        '/images/item1-2.jpg',
        '/images/item1-3.jpg'
      ],
      status: 'locked' as const,
      sellerId: 'seller1',
      sellerName: '徐小米',
      sellerAvatar: '/images/avatar1.jpg',
      publishTime: '2024-05-19',
      lockInfo: {
        lockUserId: 'buyer1',
        lockUserName: '王同学',
        lockTime: '2024-05-19 17:30',
        expireTime: '2024-05-19 22:30'
      }
    } as ItemDetail,
    
    mockComments: [
      {
        id: '1',
        userId: 'buyer1',
        userName: '王同学',
        userAvatar: '/images/avatar2.jpg',
        content: '周末可约看货吗？想确认一下音质表现。',
        createTime: '今天 10:45',
        replyTo: ''
      },
      {
        id: '2',
        userId: 'seller1',
        userName: '徐小米',
        userAvatar: '/images/avatar1.jpg',
        content: '下午 3 点后都在家。',
        createTime: '今天 11:20',
        isSeller: true,
        replyTo: '1'
      },
      {
        id: '3',
        userId: 'admin',
        userName: '小区管家',
        userAvatar: '/images/avatar3.jpg',
        content: '交易完成后，请记得在订单中确认收货。',
        createTime: '昨天 21:12'
      }
    ] as Comment[]
  },

  // 倒计时定时器
  countdownTimer: null as number | null,

  onLoad(options: any) {
    const { id } = options
    console.log('物品详情页面加载，物品ID:', id)
    
    // 加载物品详情
    this.loadItemDetail(id)
    
    // 开始倒计时
    this.startCountdown()
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData()
  },

  onUnload() {
    // 清除倒计时
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },

  // 加载物品详情
  loadItemDetail(itemId: string) {
    // TODO: 从云数据库获取真实数据
    // 这里使用模拟数据
    setTimeout(() => {
      this.setData({
        item: this.data.mockItem,
        comments: this.data.mockComments,
        loading: false
      })
    }, 500)
  },

  // 刷新数据
  refreshData() {
    // TODO: 刷新物品状态和留言
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
    if (!item) return
    
    wx.previewImage({
      current: item.images[this.data.currentImageIndex],
      urls: item.images
    })
  },

  // 收藏/取消收藏
  onToggleFavorite() {
    const { isFavorited } = this.data
    
    // TODO: 调用云函数更新收藏状态
    this.setData({
      isFavorited: !isFavorited
    })
    
    wx.showToast({
      title: isFavorited ? '已取消收藏' : '已收藏',
      icon: 'success'
    })
  },

  // 订阅/取消订阅
  onToggleSubscribe(e: any) {
    const { isSubscribed } = this.data
    
    // TODO: 调用云函数更新订阅状态
    this.setData({
      isSubscribed: !isSubscribed
    })
    
    wx.showToast({
      title: isSubscribed ? '已取消关注' : '已关注',
      icon: 'success'
    })
  },

  // 联系卖家
  onContactSeller() {
    const { item } = this.data
    if (!item) return
    
    // TODO: 跳转到聊天页面或调用客服功能
    wx.showToast({
      title: '正在联系卖家...',
      icon: 'loading'
    })
  },

  // 锁定并支付
  onLockAndPay() {
    const { item } = this.data
    if (!item) return
    
    if (item.status === 'sold') {
      wx.showToast({
        title: '物品已售出',
        icon: 'none'
      })
      return
    }
    
    if (item.status === 'locked') {
      wx.showToast({
        title: '物品已被锁定',
        icon: 'none'
      })
      return
    }
    
    // TODO: 调用锁定接口
    wx.showLoading({
      title: '锁定中...'
    })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '锁定成功',
        icon: 'success'
      })
      
      // 刷新页面状态
      this.loadItemDetail(item.id)
    }, 1500)
  },

  // 留言输入
  onCommentInput(e: any) {
    this.setData({
      commentInput: e.detail.value
    })
  },

  // 发送留言
  onSendComment() {
    const { commentInput, comments } = this.data
    
    if (!commentInput.trim()) {
      wx.showToast({
        title: '请输入留言内容',
        icon: 'none'
      })
      return
    }
    
    // TODO: 调用云函数发送留言
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'current_user',
      userName: '当前用户',
      userAvatar: '/images/current-avatar.jpg',
      content: commentInput,
      createTime: '刚刚'
    }
    
    this.setData({
      comments: [...comments, newComment],
      commentInput: ''
    })
    
    wx.showToast({
      title: '留言发送成功',
      icon: 'success'
    })
  },

  // 分享
  onShareAppMessage() {
    const { item } = this.data
    if (!item) return {}
    
    return {
      title: item.title,
      path: `/pages/detail/detail?id=${item.id}`,
      imageUrl: item.images[0]
    }
  },

  // 开始倒计时
  startCountdown() {
    const { item } = this.data
    if (!item || !item.lockInfo) return
    
    this.countdownTimer = setInterval(() => {
      const now = new Date().getTime()
      const expireTime = new Date(item.lockInfo!.expireTime).getTime()
      const remaining = expireTime - now
      
      if (remaining <= 0) {
        clearInterval(this.countdownTimer!)
        this.setData({
          lockCountdown: '已过期'
        })
        // 刷新数据
        this.loadItemDetail(item.id)
        return
      }
      
      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      
      this.setData({
        lockCountdown: `剩余 ${hours} 小时 ${minutes} 分钟`
      })
    }, 1000)
  }
})
