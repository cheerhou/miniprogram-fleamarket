// app.ts
interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
  checkUserStatus: () => void
}

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-8gpygj0pe840f225', // 云开发环境ID
        traceUser: true,
      })
      console.log('云开发初始化成功')
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId

        // 检查用户注册状态
        this.checkUserStatus()
      },
    })
  },

  async checkUserStatus() {
    try {
      const cloudUtils = require('./utils/cloud').default
      const result = await cloudUtils.getUserInfo()

      // 如果是新用户（isNew为true）或获取失败，跳转到注册页
      if (result.isNew) {
        wx.reLaunch({
          url: '/pages/register/register'
        })
      }
    } catch (error) {
      console.error('检查用户状态失败:', error)
      // 失败时也跳转注册页，确保安全
      wx.reLaunch({
        url: '/pages/register/register'
      })
    }
  },
})
