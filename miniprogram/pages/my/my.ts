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
        url: '',
      },
    ],
    lockingOrder: <LockingOrder>{
      title: '戴森手持吸尘器',
      statusLabel: '待支付',
      statusTheme: 'warning',
      remaining: '剩余锁定 04:37:12',
      location: '北区 2 栋门厅',
    },
    publishedItem: <PublishedItem>{
      title: '小米音箱 Pro',
      statusLabel: '已锁定',
      stats: ['想要 12', '浏览 132'],
      focus: '买家王同学 · 等待支付',
    },
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

  onQuickLinkTap(event: WechatMiniprogram.TouchEvent) {
    const { url, text } = event.currentTarget.dataset as { url?: string; text: string }
    if (url) {
      wx.navigateTo({ url })
      return
    }
    wx.showToast({ title: `${text}功能开发中`, icon: 'none' })
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
