import cloudUtils from '../../utils/cloud'

interface QuickStat {
  text: string
  value: string
  icon: string
  color: 'brand' | 'warning' | 'success' | 'default'
  url?: string
}

interface LockingOrder {
  title: string
  statusLabel: string
  statusTheme: 'warning' | 'success' | 'danger' | 'primary'
  remaining: string
  location: string
}

interface PublishedItem {
  title: string
  statusLabel: string
  stats: string[]
  focus: string
}

interface PaymentPanel {
  title: string
  meta: string
  actionText: string
  theme: 'brand' | 'default'
}

interface NotificationSetting {
  title: string
  description: string
  value: boolean
}

Page({
  data: {
    userInfo: {
      name: '徐小米',
      community: '碧桂园 · 逸翠湾',
      address: '3 栋 · 已物业认证',
      avatar: '',
    },
    quickStats: <QuickStat[]>[
      {
        text: '我的发布',
        value: '6',
        icon: 'app',
        color: 'brand',
        url: '',
      },
      {
        text: '锁定中',
        value: '2',
        icon: 'lock-on',
        color: 'warning',
        url: '',
      },
      {
        text: '已购买',
        value: '8',
        icon: 'cart',
        color: 'success',
        url: '',
      },
      {
        text: '通知中心',
        value: '3',
        icon: 'notification',
        color: 'brand',
        url: '/pages/notifications/notifications',
      },
    ],
    lockingOrder: null as LockingOrder | null,
    publishedItem: null as PublishedItem | null,
    paymentPanels: <PaymentPanel[]>[
      {
        title: '微信支付',
        meta: '上月成交 ¥2,560',
        actionText: '查看记录',
        theme: 'brand',
      },
      {
        title: '数据概览',
        meta: '近 30 日浏览 320 次',
        actionText: '数据明细',
        theme: 'default',
      },
    ],
    notificationSettings: <NotificationSetting[]>[
      {
        title: '锁定状态变更',
        description: '锁定成功、释放将实时通知',
        value: true,
      },
      {
        title: '物品售出提醒',
        description: '售出后推送成交与对账信息',
        value: true,
      },
      {
        title: '留言回复提醒',
        description: '买家留言及回复即时可见',
        value: false,
      },
    ],
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示页面都刷新数据
    this.loadData()
  },

  async loadData() {
    try {
      // 1. 获取用户信息
      const userInfoResult = await cloudUtils.getUserInfo()
      if (userInfoResult.success) {
        this.setData({
          userInfo: {
            name: userInfoResult.data.name || '微信用户',
            community: userInfoResult.data.community || '未认证社区',
            address: userInfoResult.data.address || '未填写地址',
            avatar: userInfoResult.data.avatar || ''
          }
        })
      }

      // 2. 获取统计数据
      // 我的发布
      const publishedResult = await cloudUtils.getItems({ filter: 'published', pageSize: 1 })
      const publishedCount = publishedResult.success ? publishedResult.data.total : 0

      // 锁定中
      const lockedResult = await cloudUtils.getItems({ filter: 'locked', pageSize: 1 })
      const lockedCount = lockedResult.success ? lockedResult.data.total : 0

      // 已购买
      const boughtResult = await cloudUtils.getItems({ filter: 'bought', pageSize: 1 })
      const boughtCount = boughtResult.success ? boughtResult.data.total : 0

      // 通知中心（未读数）
      const notificationResult = await cloudUtils.getUserNotifications({ isRead: 'false', pageSize: 1 })
      const notificationCount = notificationResult.success ? notificationResult.data.total : 0

      // 更新统计数据
      this.setData({
        'quickStats[0].value': String(publishedCount),
        'quickStats[1].value': String(lockedCount),
        'quickStats[2].value': String(boughtCount),
        'quickStats[3].value': String(notificationCount)
      })

      // 3. 更新"进行中的锁定"卡片
      if (lockedCount > 0 && lockedResult.data.list.length > 0) {
        const latestLock = lockedResult.data.list[0]
        // 计算剩余时间（假设锁定12小时）
        // 这里简化处理，实际应该根据 lockTime 计算
        const lockTime = new Date(latestLock.lockInfo?.lockTime || Date.now())
        const expireTime = new Date(lockTime.getTime() + 12 * 60 * 60 * 1000)
        const now = new Date()
        const diff = expireTime.getTime() - now.getTime()
        let remaining = '已过期'

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          remaining = `剩余锁定 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        }

        this.setData({
          lockingOrder: {
            title: latestLock.title,
            statusLabel: '待支付', // 简化逻辑
            statusTheme: 'warning',
            remaining,
            location: latestLock.location || '未知地点'
          }
        })
      } else {
        // 如果没有锁定，清空或显示默认
        this.setData({
          lockingOrder: null
        })
      }

      // 4. 更新"我的发布"卡片
      if (publishedCount > 0 && publishedResult.data.list.length > 0) {
        const latestPublish = publishedResult.data.list[0]
        this.setData({
          publishedItem: {
            title: latestPublish.title,
            statusLabel: latestPublish.status === 'available' ? '出售中' : (latestPublish.status === 'locked' ? '已锁定' : '已售出'),
            stats: [`浏览 ${latestPublish.viewCount || 0}`, `想要 0`], // 想要数暂无字段
            focus: latestPublish.status === 'locked' ? '已被买家锁定' : '暂无动态'
          }
        })
      } else {
        this.setData({
          publishedItem: null
        })
      }

    } catch (error) {
      console.error('加载个人中心数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  onQuickLinkTap(event: WechatMiniprogram.TouchEvent) {
    const { url, text } = event.currentTarget.dataset as { url?: string; text: string }
    if (url) {
      wx.navigateTo({ url })
      return
    }
    // 根据点击项跳转不同页面
    if (text === '我的发布') {
      // TODO: 跳转到我的发布列表
      wx.showToast({ title: '我的发布列表开发中', icon: 'none' })
    } else if (text === '锁定中') {
      wx.navigateTo({ url: '/pages/locks/locks' })
    } else if (text === '已购买') {
      // TODO: 跳转到已购买列表
      wx.showToast({ title: '已购买列表开发中', icon: 'none' })
    } else {
      wx.showToast({ title: `${text}功能开发中`, icon: 'none' })
    }
  },

  onEditProfile() {
    wx.showToast({ title: '编辑资料暂未开放', icon: 'none' })
  },

  onContactSeller() {
    wx.showToast({ title: '已提醒卖家', icon: 'none' })
  },

  onExtendLock() {
    wx.showToast({ title: '申请延长锁定', icon: 'none' })
  },

  onCancelLock() {
    wx.showToast({ title: '已发起取消', icon: 'none' })
  },

  onPromoteItem() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  onFinishDeal() {
    wx.showToast({ title: '确认成交', icon: 'none' })
  },

  onPaymentPanelTap(event: WechatMiniprogram.TouchEvent) {
    const { title } = event.currentTarget.dataset as { title: string }
    wx.showToast({ title: `${title}功能开发中`, icon: 'none' })
  },

  onNotificationToggle(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const { index } = event.currentTarget.dataset as { index: number }
    const { value } = event.detail
    this.setData({ [`notificationSettings[${index}].value`]: value })
  },
})
