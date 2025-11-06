// index.ts
import cloudUtils from '../../utils/cloud'

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
      { _id: '1', name: '童趣', icon: 'gift' },
      { _id: '2', name: '数码', icon: 'mobile' },
      { _id: '3', name: '手作', icon: 'edit' },
      { _id: '4', name: '家居', icon: 'home' }
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
    this.loadCategories()
  },

  // 加载数据
  async loadData() {
    try {
      wx.showLoading({
        title: '加载中...'
      })
      
      // 从云数据库获取物品列表
      const result = await cloudUtils.getItems({
        page: 1,
        pageSize: 20
      })
      
      if (result.success) {
        this.setData({
          items: result.data.list
        })
      } else {
        throw new Error(result.message)
      }
      
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载分类数据
  async loadCategories() {
    try {
      // 从云数据库获取分类列表
      const result = await cloudUtils.getCategories({
        type: 'all'
      })
      
      if (result.success && result.data && result.data.list) {
        this.setData({
          categories: result.data.list
        })
        console.log('分类数据加载成功:', result.data.list)
      } else {
        throw new Error(result.message || '分类数据格式错误')
      }
      
    } catch (error) {
      console.error('加载分类失败:', error)
      // 如果加载失败，使用默认分类数据
      console.log('使用默认分类数据')
      const defaultCategories = [
        { _id: '1', name: '童趣', icon: 'gift' },
        { _id: '2', name: '数码', icon: 'mobile' },
        { _id: '3', name: '手作', icon: 'edit' },
        { _id: '4', name: '家居', icon: 'home' }
      ]
      this.setData({
        categories: defaultCategories
      })
    }
  },

  // 搜索输入
  onSearchInput(e: any) {
    this.setData({
      searchKeyword: e.detail.value
    })
    
    // 如果清空搜索框，自动加载完整列表
    if (!e.detail.value.trim()) {
      this.clearSearch()
    }
  },

  // 清除搜索
  async clearSearch() {
    this.setData({
      searchKeyword: ''
    })
    
    // 重新加载完整列表
    await this.loadData()
  },

  // 执行搜索 - 跳转到搜索页面
  onSearch() {
    const { searchKeyword } = this.data
    
    if (searchKeyword.trim()) {
      // 如果有搜索关键词，传递到搜索页面
      wx.navigateTo({
        url: `/pages/search/search?keyword=${encodeURIComponent(searchKeyword.trim())}`
      })
    } else {
      // 如果没有关键词，直接跳转到搜索页面
      wx.navigateTo({
        url: '/pages/search/search'
      })
    }
  },

  // 点击搜索框 - 跳转到搜索页面
  onSearchBoxTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 点击通知
  onNotification() {
    wx.navigateTo({
      url: '/pages/notifications/notifications'
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
    const { name } = e.currentTarget.dataset
    console.log('点击分类:', name)
    
    if (!name) {
      wx.showToast({
        title: '分类名称不存在',
        icon: 'none'
      })
      return
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '加载中...'
    })
    
    // 跳转到分类筛选页面，传递分类名称
    wx.navigateTo({
      url: `/pages/category/category?categoryName=${encodeURIComponent(name)}`,
      success: () => {
        wx.hideLoading()
      },
      fail: (error) => {
        wx.hideLoading()
        console.error('跳转分类页面失败:', error)
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 点击物品卡片
  onItemTap(e: any) {
    const { id } = e.currentTarget.dataset
    console.log('点击物品:', id)
    
    if (!id) {
      wx.showToast({
        title: '物品ID不存在',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 锁定物品
  onLockItem(e: any) {
    const { id } = e.currentTarget.dataset
    console.log('onLockItem - 获取到的ID:', id)
    console.log('onLockItem - 完整dataset:', e.currentTarget.dataset)
    
    if (!id) {
      wx.showToast({
        title: '物品ID不存在',
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
          this.lockItem(id)
        }
      }
    })
  },

  // 执行锁定
  async lockItem(id: string) {
    console.log('准备锁定物品，ID:', id)
    
    try {
      wx.showLoading({
        title: '锁定中...'
      })

      const result = await cloudUtils.lockItem(id)
      console.log('锁定结果:', result)

      if (result.success) {
        wx.showToast({
          title: '锁定成功',
          icon: 'success'
        })
        // 刷新数据
        this.loadData()
      } else {
        throw new Error(result.message)
      }

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
  onFollowItem(e: any) {
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
    const { id } = e.currentTarget.dataset
    console.log('查看详情:', id)
    wx.showToast({
      title: '物品详情页开发中',
      icon: 'none'
    })
  },

  // 订阅提醒
  onSubscribe() {
    wx.navigateTo({
      url: '/pages/notifications/notifications'
    })
  },

  // 管理订阅
  onManageSubscriptions() {
    wx.navigateTo({
      url: '/pages/notifications/notifications'
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
