// index.ts
Page({
  data: {
    // 状态栏高度
    statusBarHeight: 0,
    // 社区信息
    community: '碧桂园 · 逸翠湾',
    // 搜索关键词
    searchKeyword: '',
    // 分类列表
    categories: [
      { id: 1, name: '童趣', icon: 'gift' },
      { id: 2, name: '数码', icon: 'mobile' },
      { id: 3, name: '手作', icon: 'edit' },
      { id: 4, name: '家居', icon: 'home' }
    ],
    // 物品列表
    items: [
      {
        id: 1,
        title: '小米音箱 Pro',
        imageText: '智能音箱',
        description: '自提 · 北区 3 栋大厅 · 赠送配件',
        price: 128,
        views: 12,
        status: 'available',
        statusText: '9 成新',
        statusTheme: 'success',
        footerIcon: 'time',
        footerText: '锁定余 5 小时',
        footerColor: '#0052D9'
      },
      {
        id: 2,
        title: '美的空气炸锅',
        imageText: '空气炸锅',
        description: 'B 区 8 栋 1 单元 · 到期 18:00',
        price: 198,
        views: 5,
        status: 'locked',
        statusText: '已被锁定',
        statusTheme: 'warning',
        footerIcon: 'check-circle',
        footerText: '等待买家支付',
        footerColor: '#2BA471'
      },
      {
        id: 3,
        title: 'Ninebot 儿童滑板车',
        imageText: '滑板车',
        description: '成交 · 线下自提',
        price: 299,
        views: 0,
        status: 'sold',
        statusText: '已售出',
        statusTheme: 'danger',
        footerIcon: 'chat',
        footerText: '4 条留言',
        footerColor: '#0052D9'
      }
    ]
  },

  onLoad() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    })
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadData()
  },

  // 加载数据
  loadData() {
    // TODO: 从云数据库加载数据
    console.log('加载首页数据')
  },

  // 搜索输入
  onSearchInput(e: any) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 执行搜索
  onSearch() {
    const { searchKeyword } = this.data
    if (!searchKeyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }
    
    console.log('搜索:', searchKeyword)
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  },

  // 点击通知
  onNotification() {
    wx.showToast({
      title: '通知中心开发中',
      icon: 'none'
    })
  },

  // 点击个人头像
  onProfile() {
    wx.navigateTo({
      url: '/pages/my/my'
    })
  },

  // 点击分类
  onCategoryTap(e: any) {
    const { id } = e.currentTarget.dataset
    console.log('点击分类:', id)
    wx.showToast({
      title: '分类筛选开发中',
      icon: 'none'
    })
  },

  // 点击物品卡片
  onItemTap(e: any) {
    const { id } = e.currentTarget.dataset
    console.log('点击物品:', id)
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 锁定物品
  onLockItem(e: any) {
    e.stopPropagation()
    const { id } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认锁定',
      content: '锁定后将为您保留 12 小时，请在锁定期内完成支付',
      confirmText: '确认锁定',
      success: (res) => {
        if (res.confirm) {
          console.log('锁定物品:', id)
          wx.showToast({
            title: '锁定成功',
            icon: 'success'
          })
          // TODO: 调用云函数锁定物品
        }
      }
    })
  },

  // 关注物品
  onFollowItem(e: any) {
    e.stopPropagation()
    const { id } = e.currentTarget.dataset
    console.log('关注物品:', id)
    wx.showToast({
      title: '关注成功',
      icon: 'success'
    })
    // TODO: 调用云函数关注物品
  },

  // 查看详情
  onViewDetail(e: any) {
    e.stopPropagation()
    const { id } = e.currentTarget.dataset
    console.log('查看详情:', id)
    wx.showToast({
      title: '物品详情页开发中',
      icon: 'none'
    })
  },

  // 订阅提醒
  onSubscribe() {
    wx.showToast({
      title: '订阅功能开发中',
      icon: 'none'
    })
  },

  // 管理订阅
  onManageSubscriptions() {
    wx.showToast({
      title: '订阅管理开发中',
      icon: 'none'
    })
  },

  // 编辑订阅
  onEditSubscription() {
    wx.showToast({
      title: '编辑订阅开发中',
      icon: 'none'
    })
  },

  // 发布物品
  onPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  },

  // 底部导航切换
  onTabTap(e: any) {
    const { tab } = e.currentTarget.dataset
    
    switch (tab) {
      case 'index':
        // 当前页面，不需要跳转
        break
      case 'locks':
        wx.navigateTo({
          url: '/pages/locks/locks'
        })
        break
      case 'my':
        wx.navigateTo({
          url: '/pages/my/my'
        })
        break
      case 'admin':
        wx.showToast({
          title: '管理页面开发中',
          icon: 'none'
        })
        break
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '社区二手市场 - 发现身边的好物',
      path: '/pages/index/index'
    }
  }
})
