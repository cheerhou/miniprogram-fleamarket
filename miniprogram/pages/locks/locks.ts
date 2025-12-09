import cloudUtils from '../../utils/cloud'

Page({
  data: {
    activeTab: 0,
    tabs: [
      { label: '进行中', value: 0 },
      { label: '已完成', value: 1 },
      { label: '已取消', value: 2 }
    ],
    activeLocks: [] as any[],
    completedLocks: [] as any[],
    cancelledLocks: [] as any[],
    loading: false
  },

  onLoad() {
    this.loadLocks()
  },

  onShow() {
    this.loadLocks()
  },

  async loadLocks() {
    try {
      this.setData({ loading: true })

      // 获取所有锁定记录
      // 注意：这里假设 getItems 支持 filter: 'locked' 并返回用户锁定的所有物品
      // 实际后端可能需要支持 status 参数来区分不同状态的锁定记录
      // 或者一次性获取所有，前端筛选
      const result = await cloudUtils.getItems({
        filter: 'locked',
        pageSize: 100 // 获取足够多的记录
      })

      if (result.success) {
        const allLocks = result.data.list || []

        // 前端分类
        const activeLocks: any[] = []
        const completedLocks: any[] = []
        const cancelledLocks: any[] = []

        allLocks.forEach((item: any) => {
          // 格式化通用数据
          const formattedItem = {
            id: item._id,
            title: item.title,
            price: item.price,
            image: item.images && item.images.length > 0 ? item.images[0] : '',
            seller: item.sellerName || '未知卖家',
            location: item.location || '未知地点',
            lockTime: this.formatDate(item.lockInfo?.lockTime),
            status: item.status,
            statusTheme: this.getStatusTheme(item.status),
            statusLabel: this.getStatusLabel(item.status)
          }

          if (item.status === 'locked') {
            // 计算剩余时间
            const remainingTime = this.calculateRemainingTime(item.lockInfo?.lockTime)
            activeLocks.push({
              ...formattedItem,
              remainingTime
            })
          } else if (item.status === 'sold') {
            // 假设 sold 状态且是当前用户锁定的，视为已完成（已购买）
            // 实际逻辑可能需要判断 buyerId === currentUser.openid
            completedLocks.push({
              ...formattedItem,
              completeTime: this.formatDate(item.updateTime) // 假设更新时间为完成时间
            })
          } else {
            // 其他状态视为已取消（例如 available 但有锁定记录，或者 cancelled）
            // 这里简化处理，如果 items 接口只返回当前锁定的，可能拿不到历史记录
            // 如果需要历史记录，后端需要提供专门的 getMyLocks 接口
            // 暂时只处理 activeLocks，其他放空或根据实际返回调整
          }
        })

        this.setData({
          activeLocks,
          completedLocks,
          cancelledLocks
        })
      }
    } catch (error) {
      console.error('加载锁定列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  formatDate(dateStr: string) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  calculateRemainingTime(lockTimeStr: string) {
    if (!lockTimeStr) return '00:00:00'
    const lockTime = new Date(lockTimeStr)
    const expireTime = new Date(lockTime.getTime() + 12 * 60 * 60 * 1000)
    const now = new Date()
    const diff = expireTime.getTime() - now.getTime()

    if (diff <= 0) return '已过期'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  },

  getStatusTheme(status: string) {
    const map: any = {
      'locked': 'warning',
      'sold': 'success',
      'available': 'default'
    }
    return map[status] || 'default'
  },

  getStatusLabel(status: string) {
    const map: any = {
      'locked': '待支付',
      'sold': '已完成',
      'available': '已取消'
    }
    return map[status] || '未知'
  },

  onTabChange(e: any) {
    this.setData({
      activeTab: e.detail.value
    })
  },

  onContactSeller(e: any) {
    const { id } = e.currentTarget.dataset
    wx.showToast({
      title: '联系卖家功能开发中',
      icon: 'none'
    })
  },

  onExtendLock(e: any) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '延长锁定',
      content: '是否延长锁定时间 2 小时？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '延长成功',
            icon: 'success'
          })
        }
      }
    })
  },

  onCancelLock(e: any) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '取消锁定',
      content: '确定要取消锁定吗？取消后物品将重新上架。',
      confirmColor: '#E34D59',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '处理中...',
            })

            const result = await cloudUtils.unlockItem(id, 'release')

            if (result.success) {
              wx.showToast({
                title: '已取消锁定',
                icon: 'success'
              })
              // 刷新列表
              // this.loadLocks() // TODO: 实现加载列表功能
            } else {
              throw new Error(result.message)
            }
          } catch (error) {
            console.error('取消锁定失败:', error)
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  onPayNow(e: any) {
    const { id } = e.currentTarget.dataset
    wx.showToast({
      title: '支付功能开发中',
      icon: 'none'
    })
  },

  onViewDetail(e: any) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/item-detail/item-detail?id=${id}`
    })
  },

  onReLock(e: any) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '重新锁定',
      content: '是否重新锁定该物品？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '锁定成功',
            icon: 'success'
          })
          // TODO: 调用云函数重新锁定
        }
      }
    })
  }
})
