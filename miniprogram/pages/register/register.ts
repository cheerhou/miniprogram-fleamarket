import cloudUtils from '../../utils/cloud'

Page({
    data: {
        name: '',
        community: '',
        address: '',
        avatar: '',
        communities: [
            { label: '碧桂园 · 逸翠湾', value: '碧桂园 · 逸翠湾' },
            { label: '万科 · 金域华府', value: '万科 · 金域华府' },
            { label: '保利 · 天悦', value: '保利 · 天悦' },
            { label: '中海 · 寰宇天下', value: '中海 · 寰宇天下' }
        ],
        showCommunityPicker: false,
        communityText: '',
    },

    onLoad() {
        wx.hideHomeButton() // 隐藏返回首页按钮，强制注册
    },

    onNameInput(e: any) {
        this.setData({ name: e.detail.value })
    },

    onAddressInput(e: any) {
        this.setData({ address: e.detail.value })
    },

    onCommunityPicker() {
        this.setData({ showCommunityPicker: true })
    },

    onCommunityChange(e: any) {
        const { value, label } = e.detail
        this.setData({
            communityText: label[0],
            community: value[0]
        })
    },

    onCommunityConfirm(e: any) {
        const { value, label } = e.detail
        this.setData({
            communityText: label[0],
            community: value[0],
            showCommunityPicker: false
        })
    },

    onCommunityCancel() {
        this.setData({ showCommunityPicker: false })
    },

    async onSubmit() {
        const { name, community, address } = this.data

        if (!name || !community || !address) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            })
            return
        }

        try {
            wx.showLoading({ title: '注册中...' })

            const result = await cloudUtils.registerUser({
                name,
                community,
                address
            })

            if (result.success) {
                wx.showToast({
                    title: '注册成功',
                    icon: 'success'
                })

                // 注册成功后跳转到首页
                setTimeout(() => {
                    wx.reLaunch({
                        url: '/pages/index/index'
                    })
                }, 1500)
            } else {
                throw new Error(result.message)
            }
        } catch (error) {
            console.error('注册失败:', error)
            wx.showToast({
                title: '注册失败，请重试',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
        }
    }
})
