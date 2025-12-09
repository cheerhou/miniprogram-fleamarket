import cloudUtils from '../../utils/cloud'

Page({
    data: {
        name: '',
        community: '',
        room: '',
        avatar: '',
        communities: [
            { label: '远大中央公园 1 期', value: '远大中央公园 1 期' },
            { label: '远大中央公园 2 期', value: '远大中央公园 2 期' },
            { label: '远大中央公园 3 期', value: '远大中央公园 3 期' },
            { label: '远大中央公园 4 期', value: '远大中央公园 4 期' }
        ],
        showCommunityPicker: false,
        communityText: '',

        // Address Picker Data
        showAddressPicker: false,
        addressText: '',
        addressValue: [] as any[],
        addressOptions: [] as any[]
    },

    onLoad() {
        this.initAddressOptions()
        this.loadUserInfo()
    },

    initAddressOptions() {
        // Generate Buildings: 1-30 栋
        const buildings = Array.from({ length: 30 }, (_, i) => ({
            label: `${i + 1} 栋`,
            value: `${i + 1} 栋`
        }))

        // Generate Units: 1-3 单元
        const units = Array.from({ length: 3 }, (_, i) => ({
            label: `${i + 1} 单元`,
            value: `${i + 1} 单元`
        }))

        this.setData({
            addressOptions: [buildings, units]
        })
    },

    async loadUserInfo() {
        try {
            wx.showLoading({ title: '加载中...' })
            const result = await cloudUtils.getUserInfo()
            if (result.success) {
                const { name, community, address } = result.data

                // Parse address: "X 栋 Y 单元 Z 房"
                // Regex to extract parts
                const addressMatch = address.match(/^(.+栋)\s+(.+单元)(?:\s+(.+房))?$/)

                let addressValue: string[] = []
                let addressText = ''
                let room = ''

                let avatarUrl = result.data.avatar || ''

                // 如果是云存储ID，换取临时链接
                if (avatarUrl.startsWith('cloud://')) {
                    console.log('转换前 avatarUrl:', avatarUrl)
                    try {
                        const fileRes = await wx.cloud.getTempFileURL({
                            fileList: [avatarUrl]
                        })
                        console.log('getTempFileURL result:', fileRes)
                        if (fileRes.fileList && fileRes.fileList.length > 0) {
                            avatarUrl = fileRes.fileList[0].tempFileURL
                            console.log('转换后 avatarUrl:', avatarUrl)
                        }
                    } catch (err) {
                        console.error('换取头像链接失败:', err)
                    }
                } else {
                    console.log('非云存储ID avatarUrl:', avatarUrl)
                }

                if (addressMatch) {
                    addressValue = [addressMatch[1], addressMatch[2]]
                    addressText = `${addressMatch[1]} ${addressMatch[2]}`
                    room = addressMatch[3] ? addressMatch[3].replace('房', '') : ''
                } else {
                    // Fallback if format doesn't match
                    addressText = address
                }

                this.setData({
                    name,
                    community,
                    communityText: community,
                    addressText,
                    addressValue,
                    room,
                    avatar: avatarUrl
                })
            }
        } catch (error) {
            console.error('加载用户信息失败:', error)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            wx.hideLoading()
        }
    },

    async onChooseAvatar() {
        try {
            const res = await wx.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
            })

            const tempFilePath = res.tempFiles[0].tempFilePath
            console.log('选择图片路径:', tempFilePath)

            // 立即显示本地图片，提升体验
            this.setData({
                avatar: tempFilePath
            })

            wx.showLoading({ title: '上传中...' })

            // Upload to cloud
            const uploadResult = await cloudUtils.uploadImages([tempFilePath], 'avatars')
            console.log('上传结果:', uploadResult)

            if (uploadResult && uploadResult.length > 0) {
                // 上传成功，保存 fileID 到 newAvatarId，但不更新显示的 avatar（保持本地路径显示）
                this.setData({
                    newAvatarId: uploadResult[0]
                })
            } else {
                console.error('上传返回为空')
                wx.showToast({ title: '上传失败', icon: 'none' })
            }
        } catch (error) {
            console.error('上传头像失败:', error)
            // Ignore cancel error
            if ((error as any).errMsg !== 'chooseMedia:fail cancel') {
                wx.showToast({ title: '上传失败', icon: 'none' })
            }
        } finally {
            wx.hideLoading()
        }
    },

    onNameInput(e: any) {
        this.setData({ name: e.detail.value })
    },

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

    onAddressChange() {
        // Column change logic if needed
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
        const { name, community, addressValue, room, newAvatarId, avatar } = this.data

        if (!name || !community || !addressValue || addressValue.length < 2) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            })
            return
        }

        const fullAddress = `${addressValue[0]} ${addressValue[1]} ${room ? room + '房' : ''}`.trim()

        try {
            wx.showLoading({ title: '保存中...' })

            // 优先使用新上传的头像ID，否则使用原有头像
            const avatarToSave = newAvatarId || avatar

            const result = await cloudUtils.updateUserInfo({
                name,
                community,
                address: fullAddress,
                avatar: avatarToSave
            })

            if (result.success) {
                wx.showToast({
                    title: '保存成功',
                    icon: 'success'
                })

                setTimeout(() => {
                    wx.navigateBack()
                }, 1500)
            } else {
                throw new Error(result.message)
            }
        } catch (error: any) {
            console.error('保存失败:', error)
            wx.showToast({
                title: error.message || '保存失败，请重试',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
        }
    }
})
