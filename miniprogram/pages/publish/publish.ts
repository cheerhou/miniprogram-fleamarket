// miniprogram/pages/publish/publish.ts
import cloudUtils from '../../utils/cloud'

Page({
  data: {
    // 表单数据
    title: '',
    description: '',
    price: '',
    condition: '9成新',
    category: '家居', // 存储分类名称
    location: '',
    images: [] as string[],
    
    // 选项数据
    conditionOptions: [
      { label: '全新', value: '全新' },
      { label: '9成新', value: '9成新' },
      { label: '8成新', value: '8成新' },
      { label: '7成新', value: '7成新' },
      { label: '其他', value: '其他' }
    ],
    categoryOptions: [
      { label: '家居', value: '家居' },
      { label: '数码', value: '数码' },
      { label: '童趣', value: '童趣' },
      { label: '手作', value: '手作' },
      { label: '图书', value: '图书' },
      { label: '其他', value: '其他' }
    ],
    locationOptions: [
      { label: '北区 1 栋门厅', value: '北区 1 栋门厅' },
      { label: '北区 2 栋门厅', value: '北区 2 栋门厅' },
      { label: '北区 3 栋大厅', value: '北区 3 栋大厅' },
      { label: '南区 5 栋大堂', value: '南区 5 栋大堂' },
      { label: '东区 3 栋', value: '东区 3 栋' },
      { label: '西区 1 栋', value: '西区 1 栋' },
      { label: '其他（备注说明）', value: '其他' }
    ],
    
    // 上传配置
    maxImageCount: 9,
    
    // Picker 显示控制
    showConditionPicker: false,
    showCategoryPicker: false,
    showLocationPicker: false,
    
    // Picker 值
    conditionPickerValue: [1],
    categoryPickerValue: [0],
    locationPickerValue: [0]
  },

  onLoad() {
    console.log('发布页面加载')
  },

  // 标题输入
  onTitleInput(e: any) {
    this.setData({
      title: e.detail.value
    })
  },

  // 描述输入
  onDescriptionInput(e: any) {
    this.setData({
      description: e.detail.value
    })
  },

  // 价格输入
  onPriceInput(e: any) {
    this.setData({
      price: e.detail.value
    })
  },

  // 物品状态选择
  onConditionChange(e: any) {
    const { value } = e.detail
    this.setData({
      condition: this.data.conditionOptions[value].value,
      conditionPickerValue: [value]
    })
  },

  // 分类选择
  onCategoryChange(e: any) {
    const { value } = e.detail
    const selectedCategory = this.data.categoryOptions[value]
    this.setData({
      category: selectedCategory.value, // 存储分类名称
      categoryPickerValue: [value]
    })
  },

  // 交易地点选择
  onLocationChange(e: any) {
    const { value } = e.detail
    this.setData({
      location: this.data.locationOptions[value].value,
      locationPickerValue: [value]
    })
  },

  // 选择图片
  onChooseImage() {
    const { images, maxImageCount } = this.data
    const remainCount = maxImageCount - images.length

    if (remainCount <= 0) {
      wx.showToast({
        title: `最多上传${maxImageCount}张图片`,
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: [...images, ...tempFiles]
        })
      }
    })
  },

  // 删除图片
  onDeleteImage(e: any) {
    const { index } = e.currentTarget.dataset
    const { images } = this.data
    images.splice(index, 1)
    this.setData({
      images
    })
  },

  // 预览图片
  onPreviewImage(e: any) {
    const { index } = e.currentTarget.dataset
    const { images } = this.data
    wx.previewImage({
      current: images[index],
      urls: images
    })
  },

  // 表单验证
  validateForm() {
    const { title, description, price, location, images } = this.data

    if (!title.trim()) {
      wx.showToast({
        title: '请输入物品标题',
        icon: 'none'
      })
      return false
    }

    if (title.length < 2) {
      wx.showToast({
        title: '标题至少2个字符',
        icon: 'none'
      })
      return false
    }

    if (!description.trim()) {
      wx.showToast({
        title: '请输入物品描述',
        icon: 'none'
      })
      return false
    }

    if (!price || parseFloat(price) <= 0) {
      wx.showToast({
        title: '请输入正确的价格',
        icon: 'none'
      })
      return false
    }

    if (!location) {
      wx.showToast({
        title: '请选择交易地点',
        icon: 'none'
      })
      return false
    }

    if (images.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 发布物品
  async onPublish() {
    if (!this.validateForm()) {
      return
    }

    wx.showLoading({
      title: '发布中...'
    })

    try {
      const { title, description, price, condition, category, location, images } = this.data
      
      // 1. 上传图片到云存储
      const uploadResult = await this.uploadImages(images)
      if (!uploadResult.success) {
        throw new Error(uploadResult.message)
      }
      
      // 2. 创建物品记录
      const itemData = {
        title,
        description,
        price,
        condition,
        category, // 分类ID（用于筛选和显示）
        location,
        images: uploadResult.data?.map((item: any) => item.fileID) || []
      }
      
      console.log('准备创建物品记录:', itemData)
      
      // 临时解决方案：直接使用数据库API
      try {
        const db = wx.cloud.database()
        
        // 注意：小程序端无法直接创建集合，需要在控制台手动创建
        console.log('请确保在云开发控制台已创建 items 集合')
        
        const result = await db.collection('items').add({
          data: {
            ...itemData,
            status: 'available',
            sellerId: '', // 暂时为空
            sellerName: '用户',
            sellerAvatar: '',
            publishTime: new Date(),
            updateTime: new Date(),
            viewCount: 0,
            lockInfo: null
          }
        })
        console.log('直接创建物品成功:', result)
      } catch (dbError) {
        console.error('直接数据库操作失败:', dbError)
        throw new Error('数据库操作失败，请检查云开发权限')
      }
      
      // 3. 清除草稿
      wx.removeStorageSync('publish_draft')
      
      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 2000
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
      
    } catch (error: any) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none'
      })
    }
  },

  // 上传图片
  async uploadImages(tempFilePaths: string[]) {
    try {
      console.log('开始上传图片，数量:', tempFilePaths.length)
      
      // 直接使用 wx.cloud.uploadFile 上传图片
      const uploadTasks = tempFilePaths.map(async (filePath, index) => {
        try {
          const fileName = `items/${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.jpg`
          
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: fileName,
            filePath: filePath
          })
          
          console.log('图片上传成功:', uploadResult.fileID)
          
          return {
            fileID: uploadResult.fileID,
            tempFileURL: uploadResult.fileID,
            fileName: fileName
          }
        } catch (error) {
          console.error(`图片上传失败 ${filePath}:`, error)
          return null
        }
      })
      
      const results = await Promise.all(uploadTasks)
      const successResults = results.filter(result => result !== null)
      
      if (successResults.length === 0) {
        return {
          success: false,
          message: '所有图片上传失败'
        }
      }
      
      console.log('成功上传图片数量:', successResults.length)
      
      return {
        success: true,
        data: successResults
      }
      
    } catch (error) {
      console.error('图片上传异常:', error)
      return {
        success: false,
        message: '图片上传失败'
      }
    }
  },

  // 保存草稿
  onSaveDraft() {
    const { title, description, price, condition, category, location, images } = this.data
    
    if (!title && !description && images.length === 0) {
      wx.showToast({
        title: '没有可保存的内容',
        icon: 'none'
      })
      return
    }

    // 保存到本地存储
    wx.setStorageSync('publish_draft', {
      title,
      description,
      price,
      condition,
      category, // 保存分类名称
      location,
      images,
      savedAt: new Date().toISOString()
    })

    wx.showToast({
      title: '草稿已保存',
      icon: 'success'
    })
  },

  // 加载草稿
  loadDraft() {
    try {
      const draft = wx.getStorageSync('publish_draft')
      if (draft) {
        wx.showModal({
          title: '发现草稿',
          content: '是否加载上次保存的草稿？',
          success: (res) => {
            if (res.confirm) {
              // 根据分类名称找到对应的选项索引
              const categoryIndex = this.data.categoryOptions.findIndex(
                option => option.value === draft.category
              )
              
              this.setData({
                title: draft.title || '',
                description: draft.description || '',
                price: draft.price || '',
                condition: draft.condition || '9成新',
                category: draft.category || '家居', // 分类名称
                categoryPickerValue: [categoryIndex >= 0 ? categoryIndex : 0],
                location: draft.location || '',
                images: draft.images || []
              })
              wx.showToast({
                title: '草稿已加载',
                icon: 'success'
              })
            }
          }
        })
      }
    } catch (e) {
      console.error('加载草稿失败', e)
    }
  },

  onShow() {
    // 检查是否有草稿
    this.loadDraft()
  }
})
