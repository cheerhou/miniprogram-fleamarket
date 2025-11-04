// search.ts
import cloudUtils from '../../utils/cloud'

interface SearchItem {
  _id?: string
  id: string
  title: string
  description: string
  price: number
  views: number
  status: 'available' | 'locked' | 'sold'
  statusText: string
  statusTheme: string
  footerIcon: string
  footerText: string
  footerColor: string
  images?: string[]
  imageText?: string
}

Page({
  data: {
    // 状态栏高度
    statusBarHeight: 0,
    // 搜索关键词
    searchKeyword: '',
    // 输入框焦点状态
    inputFocused: false,
    // 搜索状态：idle, searching, success, empty, error
    searchStatus: 'idle',
    // 搜索结果
    searchResults: [] as SearchItem[],
    // 搜索历史
    searchHistory: [] as string[],
    // 热门搜索
    hotSearches: ['小米音箱', '空气炸锅', '儿童滑板车', '美的', '九阳', '戴森'],
    // 排序类型：time, price
    sortType: 'time',
    // 当前页码
    currentPage: 1,
    // 每页数量
    pageSize: 20,
    // 是否有更多数据
    hasMore: false,
    // 错误信息
    errorMessage: ''
  },

  onLoad(options: any) {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    })

    // 获取传入的搜索关键词
    if (options.keyword) {
      this.setData({
        searchKeyword: decodeURIComponent(options.keyword),
        inputFocused: true
      })
      // 自动执行搜索
      this.onSearch()
    }

    // 加载搜索历史
    this.loadSearchHistory()
  },

  onShow() {
    // 页面显示时聚焦输入框
    if (this.data.searchKeyword) {
      this.setData({
        inputFocused: true
      })
    }
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || []
      this.setData({
        searchHistory: history.slice(0, 10) // 最多显示10个
      })
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword: string) {
    try {
      let history = wx.getStorageSync('searchHistory') || []
      
      // 移除重复项
      history = history.filter((item: string) => item !== keyword)
      
      // 添加到开头
      history.unshift(keyword)
      
      // 最多保存20个
      history = history.slice(0, 20)
      
      wx.setStorageSync('searchHistory', history)
      this.setData({
        searchHistory: history.slice(0, 10)
      })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 清空搜索历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      confirmText: '清空',
      confirmColor: '#f56565',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({
            searchHistory: []
          })
        }
      }
    })
  },

  // 搜索输入
  onSearchInput(e: any) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 输入框聚焦
  onInputFocus() {
    this.setData({
      inputFocused: true
    })
  },

  // 输入框失焦
  onInputBlur() {
    this.setData({
      inputFocused: false
    })
  },

  // 清除搜索
  clearSearch() {
    this.setData({
      searchKeyword: '',
      searchStatus: 'idle',
      searchResults: [],
      currentPage: 1,
      hasMore: false
    })
  },

  // 执行搜索
  async onSearch() {
    const { searchKeyword, currentPage, pageSize } = this.data
    
    if (!searchKeyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }

    // 重置状态
    this.setData({
      searchStatus: 'searching',
      currentPage: 1,
      searchResults: []
    })

    try {
      // 调用云函数搜索
      const result = await cloudUtils.getItems({
        keyword: searchKeyword.trim(),
        page: 1,
        pageSize: pageSize,
        sortBy: this.data.sortType
      })

      if (result.success) {
        const items = this.formatSearchResults(result.data.list || [])
        
        this.setData({
          searchStatus: items.length === 0 ? 'empty' : 'success',
          searchResults: items,
          hasMore: items.length === pageSize
        })

        // 保存搜索历史
        this.saveSearchHistory(searchKeyword.trim())
      } else {
        throw new Error(result.message || '搜索失败')
      }

    } catch (error: any) {
      console.error('搜索失败:', error)
      this.setData({
        searchStatus: 'error',
        errorMessage: error.message || '网络异常，请重试'
      })
    }
  },

  // 格式化搜索结果
  formatSearchResults(items: any[]): SearchItem[] {
    return items.map(item => ({
      _id: item._id || item.id,
      id: item.id || item._id,
      title: item.title || '未命名物品',
      description: item.description || '暂无描述',
      price: item.price || 0,
      views: item.views || 0,
      status: item.status || 'available',
      statusText: this.getStatusText(item.status),
      statusTheme: this.getStatusTheme(item.status),
      footerIcon: this.getFooterIcon(item.status),
      footerText: this.getFooterText(item),
      footerColor: this.getFooterColor(item.status),
      images: item.images || [],
      imageText: this.getImageText(item.category)
    }))
  },

  // 获取状态文本
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': '9 成新',
      'locked': '已被锁定',
      'sold': '已售出'
    }
    return statusMap[status] || '9 成新'
  },

  // 获取状态主题
  getStatusTheme(status: string): string {
    const themeMap: { [key: string]: string } = {
      'available': 'success',
      'locked': 'warning',
      'sold': 'danger'
    }
    return themeMap[status] || 'success'
  },

  // 获取底部图标
  getFooterIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'available': 'time',
      'locked': 'check-circle',
      'sold': 'chat'
    }
    return iconMap[status] || 'time'
  },

  // 获取底部文本
  getFooterText(item: any): string {
    if (item.status === 'available') {
      return '锁定余 5 小时'
    } else if (item.status === 'locked') {
      return '等待买家支付'
    } else {
      return `${item.commentCount || 4} 条留言`
    }
  },

  // 获取底部颜色
  getFooterColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'available': '#0052D9',
      'locked': '#2BA471',
      'sold': '#0052D9'
    }
    return colorMap[status] || '#0052D9'
  },

  // 获取图片文本
  getImageText(category?: string): string {
    const textMap: { [key: string]: string } = {
      '数码': '数码产品',
      '家居': '家居用品',
      '童趣': '儿童玩具',
      '手作': '手工艺品'
    }
    return textMap[category || ''] || '闲置物品'
  },

  // 点击搜索历史
  onHistoryTap(e: any) {
    const { keyword } = e.currentTarget.dataset
    this.setData({
      searchKeyword: keyword
    })
    this.onSearch()
  },

  // 点击热门搜索
  onHotTap(e: any) {
    const { keyword } = e.currentTarget.dataset
    this.setData({
      searchKeyword: keyword
    })
    this.onSearch()
  },

  // 排序切换
  onSortChange(e: any) {
    const { type } = e.currentTarget.dataset
    if (type === this.data.sortType) return

    this.setData({
      sortType: type
    })

    // 重新搜索
    if (this.data.searchKeyword) {
      this.onSearch()
    }
  },

  // 点击物品卡片
  onItemTap(e: any) {
    const { id } = e.currentTarget.dataset
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
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 重试搜索
  onRetry() {
    this.onSearch()
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.onSearch()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 触底加载更多
  onReachBottom() {
    const { searchStatus, hasMore, searchKeyword, currentPage, pageSize } = this.data
    
    if (searchStatus !== 'success' || !hasMore || !searchKeyword) return

    this.setData({
      searchStatus: 'searching'
    })

    // 加载更多数据
    cloudUtils.getItems({
      keyword: searchKeyword.trim(),
      page: currentPage + 1,
      pageSize: pageSize,
      sortBy: this.data.sortType
    }).then(result => {
      if (result.success) {
        const newItems = this.formatSearchResults(result.data.list || [])
        const allItems = [...this.data.searchResults, ...newItems]
        
        this.setData({
          searchStatus: 'success',
          searchResults: allItems,
          currentPage: currentPage + 1,
          hasMore: newItems.length === pageSize
        })
      } else {
        throw new Error(result.message || '加载失败')
      }
    }).catch(error => {
      console.error('加载更多失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({
        searchStatus: 'success'
      })
    })
  },

  // 分享
  onShareAppMessage() {
    const { searchKeyword } = this.data
    return {
      title: searchKeyword ? `搜索"${searchKeyword}"的物品` : '社区二手市场 - 发现身边的好物',
      path: searchKeyword ? `/pages/search/search?keyword=${encodeURIComponent(searchKeyword)}` : '/pages/index/index'
    }
  }
})
