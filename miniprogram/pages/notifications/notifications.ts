// notifications.ts
import cloudUtils from '../../utils/cloud'

interface Notification {
  _id: string
  userId: string
  itemId: string
  type: 'item_released' | 'item_sold' | string
  actorId: string
  actorName: string
  title: string
  content: string
  isRead: boolean
  createTime: Date
  readTime?: Date
  item?: {
    _id: string
    title: string
    images: string[]
    price: number
    status: string
  }
}

interface TypeCount {
  all: number
  released: number
  sold: number
}

Page({
  data: {
    // 状态栏高度
    statusBarHeight: 0,
    // 通知列表
    notifications: [] as Notification[],
    // 分页信息
    page: 1,
    pageSize: 20,
    hasMore: true,
    // 筛选类型
    currentType: '',
    // 类型统计
    typeCount: {
      all: 0,
      released: 0,
      sold: 0
    } as TypeCount,
    // 未读数量
    unreadCount: 0,
    // 加载状态
    loading: false,
    loadingMore: false
  },

  onLoad() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    })
    
    // 加载通知列表
    this.loadNotifications()
  },

  onShow() {
    // 页面显示时刷新未读数量
    this.loadUnreadCount()
  },

  // 加载通知列表
  async loadNotifications(reset = false) {
    if (this.data.loading || this.data.loadingMore) return
    
    try {
      const { page, pageSize, currentType } = this.data
      
      // 重置分页
      if (reset) {
        this.setData({
          page: 1,
          notifications: [],
          hasMore: true
        })
      }
      
      // 设置加载状态
      if (page === 1) {
        this.setData({ loading: true })
      } else {
        this.setData({ loadingMore: true })
      }
      
      // 调用云函数获取通知列表
      const result = await cloudUtils.getUserNotifications({
        page: reset ? 1 : page,
        pageSize,
        type: currentType || undefined
      })
      
      if (result.success) {
        const { list, total, unreadCount, hasMore } = result.data
        
        if (reset || page === 1) {
          this.setData({
            notifications: list,
            total,
            unreadCount,
            hasMore
          })
        } else {
          this.setData({
            notifications: [...this.data.notifications, ...list],
            hasMore
          })
        }
        
        // 更新类型统计
        this.updateTypeCount()
      } else {
        throw new Error(result.message)
      }
      
    } catch (error) {
      console.error('加载通知列表失败:', error)
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

  // 加载未读数量
  async loadUnreadCount() {
    try {
      const result = await cloudUtils.getUserNotifications({
        page: 1,
        pageSize: 1,
        isRead: 'false'
      })
      
      if (result.success) {
        this.setData({
          unreadCount: result.data.unreadCount
        })
      }
    } catch (error) {
      console.error('加载未读数量失败:', error)
    }
  },

  // 更新类型统计
  async updateTypeCount() {
    try {
      // 获取各类型数量
      const [allResult, releasedResult, soldResult] = await Promise.all([
        cloudUtils.getUserNotifications({ page: 1, pageSize: 1 }),
        cloudUtils.getUserNotifications({ page: 1, pageSize: 1, type: 'item_released' }),
        cloudUtils.getUserNotifications({ page: 1, pageSize: 1, type: 'item_sold' })
      ])
      
      this.setData({
        typeCount: {
          all: allResult.success ? allResult.data.total : 0,
          released: releasedResult.success ? releasedResult.data.total : 0,
          sold: soldResult.success ? soldResult.data.total : 0
        }
      })
    } catch (error) {
      console.error('更新类型统计失败:', error)
    }
  },

  // 切换筛选类型
  onFilterChange(e: any) {
    const { type } = e.currentTarget.dataset
    
    if (type === this.data.currentType) return
    
    this.setData({
      currentType: type,
      page: 1
    })
    
    this.loadNotifications(true)
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 标记所有已读
  async onMarkAllRead() {
    if (this.data.unreadCount === 0) {
      wx.showToast({
        title: '暂无未读消息',
        icon: 'none'
      })
      return
    }
    
    try {
      wx.showModal({
        title: '确认操作',
        content: '确定要将所有消息标记为已读吗？',
        confirmText: '确定',
        success: async (res) => {
          if (res.confirm) {
            const result = await cloudUtils.callFunction('markNotificationRead', {
              markAll: true
            })
            
            if (result.success) {
              // 更新本地状态
              const updatedNotifications = this.data.notifications.map(notification => ({
                ...notification,
                isRead: true,
                readTime: new Date()
              }))
              
              this.setData({
                notifications: updatedNotifications,
                unreadCount: 0
              })
              
              wx.showToast({
                title: '标记成功',
                icon: 'success'
              })
            } else {
              throw new Error(result.message)
            }
          }
        }
      })
    } catch (error) {
      console.error('标记所有已读失败:', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    }
  },

  // 点击通知项
  async onNotificationTap(e: any) {
    const { id, itemId } = e.currentTarget.dataset
    
    // 标记为已读
    try {
      const result = await cloudUtils.callFunction('markNotificationRead', {
        notificationId: id
      })
      
      if (result.success) {
        // 更新本地状态
        const updatedNotifications = this.data.notifications.map(notification => 
          notification._id === id 
            ? { ...notification, isRead: true, readTime: new Date() }
            : notification
        )
        
        const unreadCount = Math.max(0, this.data.unreadCount - 1)
        
        this.setData({
          notifications: updatedNotifications,
          unreadCount
        })
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
    
    // 跳转到物品详情
    if (itemId) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${itemId}`
      })
    }
  },

  // 加载更多
  onLoadMore() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadNotifications()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadNotifications(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '通知中心 - 社区二手市场',
      path: '/pages/notifications/notifications'
    }
  }
})
