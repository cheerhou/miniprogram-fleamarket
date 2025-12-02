// category.ts
import cloudUtils from '../../utils/cloud'

interface CategoryItem {
  _id: string
  name: string
  icon: string
  description?: string
  itemCount?: number
  viewCount?: number
  status?: string
  isPopular?: boolean
  sort?: number
  createTime?: Date
}

interface Item {
  _id: string
  title: string
  description: string
  price: number
  images: string[]
  status: string
  statusText: string
  statusTheme: string
  views: number
  footerIcon: string
  footerText: string
  footerColor: string
  imageText?: string
  categoryId?: string
  category?: string
  publishTime?: Date
}

Page({
  data: {
    // 状态栏高度
    statusBarHeight: 0,
    // 分类名称
    categoryName: '',
    // 分类图标
    categoryIcon: '',
    // 分类信息
    categoryInfo: null as CategoryItem | null,
    // 物品列表
    items: [] as Item[],
    // 分页信息
    page: 1,
    pageSize: 20,
    hasMore: true,
    // 排序方式
    sortBy: 'time',
    // 显示排序选项
    showSortOptions: false,
    // 加载状态
    loading: false,
    loadingMore: false
  },

  onLoad(options: any) {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    })

    // 获取分类名称
    const { categoryName } = options
    if (categoryName) {
      const decodedName = decodeURIComponent(categoryName)
      this.setData({
        categoryName: decodedName,
        categoryIcon: this.getCategoryIcon(decodedName)
      })
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: decodedName
      })
      // 加载物品列表
      this.loadItems()
    } else {
      wx.showToast({
        title: '分类参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 获取分类图标
  getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      '童趣': '/resources/icon/tongqu.svg',
      '数码': '/resources/icon/shumaxiangji.svg',
      '家居': '/resources/icon/jiaju.svg',
      '运动': '/resources/icon/yundong.svg',
      '图书': '/resources/icon/tushu.svg',
      '其他': '/resources/icon/qita.svg'
    }
    return iconMap[categoryName] || '/resources/icon/tongqu.svg'
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.categoryName) {
      this.loadItems()
    }
  },

  // 加载物品列表
  async loadItems(reset = false) {
    if (this.data.loading || this.data.loadingMore) return
    
    try {
      const { page, pageSize, categoryName, sortBy } = this.data
      
      // 重置分页
      if (reset) {
        this.setData({
          page: 1,
          items: [],
          hasMore: true
        })
      }
      
      // 设置加载状态
      if (page === 1) {
        this.setData({ loading: true })
      } else {
        this.setData({ loadingMore: true })
      }
      
      // 调用云函数获取物品列表
      const result = await cloudUtils.getItems({
        page: reset ? 1 : page,
        pageSize,
        category: categoryName, // 使用分类名称筛选
        sortBy
      })
      
      if (result.success) {
        const { list, hasMore } = result.data
        
        // 移除调试日志，保持代码简洁
        
        if (reset || page === 1) {
          this.setData({
            items: list,
            hasMore
          })
        } else {
          this.setData({
            items: [...this.data.items, ...list],
            hasMore
          })
        }
      } else {
        throw new Error(result.message)
      }
      
    } catch (error) {
      console.error('加载物品列表失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({
        loading: false,
        loadingMore: false
      })
    }
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 切换排序选项显示
  onSortTap() {
    this.setData({
      showSortOptions: !this.data.showSortOptions
    })
  },

  // 改变排序方式
  onSortChange(e: any) {
    const { sort } = e.currentTarget.dataset
    if (sort !== this.data.sortBy) {
      this.setData({
        sortBy: sort,
        showSortOptions: false
      })
      // 重新加载数据
      this.loadItems(true)
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
    console.log('查看详情:', id)
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 加载更多
  onLoadMore() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadItems()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadItems(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 分享
  onShareAppMessage() {
    const { categoryName } = this.data
    return {
      title: `${categoryName || '分类'} - 发现更多好物`,
      path: `/pages/category/category?categoryName=${encodeURIComponent(categoryName)}`
    }
  }
})
