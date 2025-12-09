// category.ts
import cloudUtils from '../../utils/cloud'
import { CATEGORIES } from '../../utils/constants'

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
  viewCount: number
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
    loadingMore: false,
    // 筛选类型
    filter: ''
  },

  onLoad(options: any) {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    })

    // 获取参数
    const { categoryName, filter, title } = options

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
      this.loadItems()
    } else if (filter) {
      // 如果是筛选模式（我的发布、已购买等）
      this.setData({
        filter: filter
      })
      // 设置页面标题
      if (title) {
        wx.setNavigationBarTitle({
          title: decodeURIComponent(title)
        })
      }
      this.loadItems()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 获取分类图标
  getCategoryIcon(categoryName: string): string {
    const category = CATEGORIES.find(c => c.name === categoryName)
    return category ? category.icon : 'ellipsis'
  },

  // 根据状态获取状态文本
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': '待出售',
      'locked': '已锁定',
      'sold': '已售出'
    }
    return statusMap[status] || '待出售'
  },

  // 根据状态获取主题
  getStatusTheme(status: string): string {
    const themeMap: { [key: string]: string } = {
      'available': 'success',
      'locked': 'warning',
      'sold': 'danger'
    }
    return themeMap[status] || 'success'
  },

  // 验证图标名称是否有效
  validateIcon(iconName: string): string {
    // 有效的 TDesign 图标列表
    const validIcons = [
      'time', 'check-circle', 'chat', 'browse', 'location',
      'notification', 'search', 'close', 'home', 'user',
      'view-list', 'chart', 'heart', 'mail', 'lightbulb',
      'error-circle', 'shop', 'edit', 'mobile', 'gift'
    ]

    // 如果是有效的图标名称，直接返回
    if (validIcons.includes(iconName)) {
      return iconName
    }

    // 如果是图片路径（包含 / 或 .），验证路径是否存在
    if (iconName && (iconName.includes('/') || iconName.includes('.'))) {
      return iconName
    }

    // 默认返回 time 图标
    return 'time'
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
        filter: this.data.filter as any, // 使用筛选类型
        sortBy
      })

      if (result.success) {
        const { list, hasMore } = result.data

        // 移除调试日志，保持代码简洁

        // 格式化数据
        const items = list.map((item: any) => ({
          ...item,
          footerIcon: this.validateIcon(item.footerIcon) || 'time',
          footerColor: item.footerColor || '#0052D9',
          statusText: this.getStatusText(item.status),
          statusTheme: this.getStatusTheme(item.status)
        }))

        if (reset || page === 1) {
          this.setData({
            items,
            hasMore
          })
        } else {
          this.setData({
            items: [...this.data.items, ...items],
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
