import cloudUtils from '../../utils/cloud'
import { COMMUNITIES } from '../../utils/constants'

Page({
    data: {
        name: '',
        community: '',
        // address: '', // Removed simple address
        room: '', // Added room
        avatar: '',
        communities: COMMUNITIES,
        showCommunityPicker: false,
        communityText: '',

        // Address Picker Data
        showAddressPicker: false,
        addressText: '',
        addressValue: [],
        addressOptions: [] as any[],
    },

    onLoad() {
        wx.hideHomeButton() // 隐藏返回首页按钮，强制注册
        this.initAddressOptions()
    },

    initAddressOptions() {
        // Generate Buildings: 1-30 栋
        const buildings = Array.from({ length: 30 }, (_, i) => ({
            label: `${i + 1} 栋`,
            value: `${i + 1} 栋`
        }))

        // Generate Units: 1-3单元
        const units = Array.from({ length: 3 }, (_, i) => ({
            label: `${i + 1} 单元`,
            value: `${i + 1} 单元`
        }))

        this.setData({
            addressOptions: [buildings, units]
        })
    },

    onNameInput(e: any) {
        this.setData({ name: e.detail.value })
    },

    // onAddressInput(e: any) {
    //     this.setData({ address: e.detail.value })
    // },

    onRoomInput(e: any) {
        this.setData({ room: e.detail.value })
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

    // Address Picker Handlers
    onAddressPicker() {
        this.setData({ showAddressPicker: true })
    },

    onAddressChange(e: any) {
        // Column change logic if needed (e.g. cascading), currently independent
    },

    onAddressConfirm(e: any) {
        const { value, label } = e.detail
        this.setData({
            addressText: `${label[0]} ${label[1]}`,
            addressValue: value,
            showAddressPicker: false
        })
    },

    onAddressCancel() {
        this.setData({ showAddressPicker: false })
    },

    async onSubmit() {
        const { name, community, addressValue, room } = this.data

        if (!name || !community || !addressValue || addressValue.length < 2) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            })
            return
        }

        const fullAddress = `${addressValue[0]} ${addressValue[1]} ${room ? room + '房' : ''}`.trim()

        try {
            wx.showLoading({ title: '注册中...' })

            const result = await cloudUtils.registerUser({
                name,
                community,
                address: fullAddress
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
        } catch (error: any) {
            console.error('注册失败:', error)
            wx.showToast({
                title: error.message || '注册失败，请重试',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
        }
    }
})
