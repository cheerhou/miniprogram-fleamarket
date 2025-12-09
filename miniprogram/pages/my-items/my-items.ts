import cloudUtils from '../../utils/cloud'

Page({
    data: {
        activeTab: 0,
        activeItems: [] as any[],
        soldItems: [] as any[],
        loading: false
    },

    onLoad() {
        this.loadItems()
    },

    onShow() {
        this.loadItems()
    },

    onTabChange(e: any) {
        this.setData({
            activeTab: e.detail.value
        })
    },

    async loadItems() {
        try {
            this.setData({ loading: true })
            const result = await cloudUtils.getItems({
                filter: 'published',
                pageSize: 100
            })

            if (result.success) {
                const activeItems: any[] = []
                const soldItems: any[] = []

                result.data.list.forEach((item: any) => {
                    const formattedItem = {
                        ...item,
                        statusLabel: this.getStatusLabel(item.status),
                        statusTheme: this.getStatusTheme(item.status),
                        createTime: this.formatDate(item.createTime)
                    }

                    if (item.status === 'sold') {
                        soldItems.push(formattedItem)
                    } else {
                        activeItems.push(formattedItem)
                    }
                })

                this.setData({
                    activeItems,
                    soldItems
                })
            }
        } catch (error) {
            console.error('加载发布列表失败:', error)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    getStatusLabel(status: string) {
        const map: any = {
            'available': '出售中',
            'locked': '已锁定',
            'sold': '已售出'
        }
        return map[status] || '未知'
    },

    getStatusTheme(status: string) {
        const map: any = {
            'available': 'primary',
            'locked': 'warning',
            'sold': 'success'
        }
        return map[status] || 'default'
    },

    formatDate(dateStr: string) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    onMarkSold(e: any) {
        const { id } = e.currentTarget.dataset
        wx.showModal({
            title: '确认交易完成',
            content: '确认该物品已线下交易完成？标记后物品将下架。',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        wx.showLoading({ title: '处理中...' })
                        const result = await cloudUtils.markItemSold(id)

                        if (result.success) {
                            wx.showToast({ title: '标记成功', icon: 'success' })
                            this.loadItems()
                        } else {
                            throw new Error(result.message)
                        }
                    } catch (error: any) {
                        console.error('标记失败:', error)
                        wx.showToast({
                            title: error.message || '操作失败',
                            icon: 'none'
                        })
                    } finally {
                        wx.hideLoading()
                    }
                }
            }
        })
    },

    onViewDetail(e: any) {
        const { id } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/detail/detail?id=${id}`
        })
    }
})
