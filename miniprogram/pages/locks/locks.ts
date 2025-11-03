// miniprogram/pages/locks/locks.ts
Page({
  data: {
    activeTab: 0,
    tabs: [
      { label: '进行中', value: 0 },
      { label: '已完成', value: 1 },
      { label: '已取消', value: 2 }
    ],
    activeLocks: [
      {
        id: 1,
        title: '戴森手持吸尘器',
        price: 1200,
        image: '/images/placeholder.png',
        seller: '张同学',
        location: '北区 2 栋门厅',
        lockTime: '2024-01-15 14:30',
        remainingTime: '04:37:12',
        status: 'active',
        statusLabel: '待支付',
        statusTheme: 'warning'
      },
      {
        id: 2,
        title: 'iPhone 13 Pro 256G',
        price: 4500,
        image: '/images/placeholder.png',
        seller: '李女士',
        location: '南区 5 栋大堂',
        lockTime: '2024-01-15 16:20',
        remainingTime: '02:15:30',
        status: 'active',
        statusLabel: '待支付',
        statusTheme: 'warning'
      }
    ],
    completedLocks: [
      {
        id: 3,
        title: '小米音箱 Pro',
        price: 180,
        image: '/images/placeholder.png',
        seller: '王同学',
        location: '东区 3 栋',
        lockTime: '2024-01-14 10:00',
        completeTime: '2024-01-14 10:30',
        status: 'completed',
        statusLabel: '已完成',
        statusTheme: 'success'
      }
    ],
    cancelledLocks: [
      {
        id: 4,
        title: '宜家书桌',
        price: 300,
        image: '/images/placeholder.png',
        seller: '赵先生',
        location: '西区 1 栋',
        lockTime: '2024-01-13 15:00',
        cancelTime: '2024-01-13 16:00',
        cancelReason: '买家主动取消',
        status: 'cancelled',
        statusLabel: '已取消',
        statusTheme: 'default'
      }
    ]
  },

  onLoad() {
    console.log('锁定页面加载')
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
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已取消锁定',
            icon: 'success'
          })
          // TODO: 调用云函数取消锁定
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
