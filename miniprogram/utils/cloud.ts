// 云开发工具类
class CloudUtils {
  private static instance: CloudUtils

  public static getInstance(): CloudUtils {
    if (!CloudUtils.instance) {
      CloudUtils.instance = new CloudUtils()
    }
    return CloudUtils.instance
  }

  /**
   * 调用云函数
   * @param name 云函数名称
   * @param data 参数
   */
  public async callFunction(name: string, data: any = {}): Promise<any> {
    try {
      const result = await wx.cloud.callFunction({
        name,
        data
      })
      return result.result
    } catch (error) {
      console.error(`云函数调用失败 [${name}]:`, error)
      throw error
    }
  }

  /**
   * 上传图片到云存储
   * @param files 文件数组
   * @param folder 存储文件夹
   */
  public async uploadImages(files: any[], folder: string = 'items'): Promise<any> {
    return this.callFunction('uploadImages', {
      files,
      folder
    })
  }

  /**
   * 创建物品记录
   * @param itemData 物品数据
   */
  public async createItem(itemData: any): Promise<any> {
    return this.callFunction('createItem', itemData)
  }

  /**
   * 获取物品列表
   * @param params 查询参数
   */
  public async getItems(params: {
    page?: number
    pageSize?: number
    category?: string
    status?: string
    keyword?: string
    sortBy?: string
    filter?: 'published' | 'locked' | 'bought'
  }): Promise<any> {
    return this.callFunction('getItems', params)
  }

  /**
   * 获取物品详情
   * @param itemId 物品ID
   */
  public async getItemDetail(itemId: string): Promise<any> {
    return this.callFunction('getItemDetail', { itemId })
  }

  /**
   * 获取分类列表
   * @param params 查询参数
   */
  public async getCategories(params: {
    type?: string
  }): Promise<any> {
    return this.callFunction('getCategories', params)
  }

  /**
   * 锁定物品
   * @param itemId 物品ID
   */
  public async lockItem(itemId: string): Promise<any> {
    return this.callFunction('lockItem', { itemId })
  }

  /**
   * 取消锁定
   * @param itemId 物品ID
   * @param action 操作类型：release（释放）或 sell（售出）
   */
  public async unlockItem(itemId: string, action: 'release' | 'sell'): Promise<any> {
    return this.callFunction('unlockItem', { itemId, action })
  }

  /**
   * 获取用户信息
   */
  public async getUserInfo(): Promise<any> {
    return this.callFunction('getUserInfo')
  }

  /**
   * 更新用户信息
   * @param userData 用户数据
   */
  public async updateUserInfo(userData: any): Promise<any> {
    return this.callFunction('updateUserInfo', userData)
  }

  /**
   * 注册用户
   * @param userData 用户数据
   */
  public async registerUser(userData: {
    name: string
    community: string
    address: string
    avatar?: string
  }): Promise<any> {
    return this.callFunction('registerUser', userData)
  }

  /**
   * 发送留言
   * @param itemId 物品ID
   * @param content 留言内容
   */
  public async sendComment(itemId: string, content: string): Promise<any> {
    return this.callFunction('sendComment', { itemId, content })
  }

  /**
   * 获取留言列表
   * @param itemId 物品ID
   */
  public async getComments(itemId: string): Promise<any> {
    return this.callFunction('getComments', { itemId })
  }

  /**
   * 订阅物品
   * @param itemId 物品ID
   * @param subscribeTypes 订阅类型
   */
  public async subscribeItem(itemId: string, subscribeTypes: string[]): Promise<any> {
    return this.callFunction('subscribeItem', { itemId, subscribeTypes })
  }

  /**
   * 取消订阅
   * @param itemId 物品ID
   */
  public async unsubscribeItem(itemId: string): Promise<any> {
    return this.callFunction('unsubscribeItem', { itemId })
  }

  /**
   * 获取用户通知列表
   * @param params 查询参数
   */
  public async getUserNotifications(params: {
    page?: number
    pageSize?: number
    type?: string
    isRead?: string
  }): Promise<any> {
    return this.callFunction('getUserNotifications', params)
  }

  /**
   * 标记通知已读
   * @param params 参数
   */
  public async markNotificationRead(params: {
    notificationId?: string
    markAll?: boolean
  }): Promise<any> {
    return this.callFunction('markNotificationRead', params)
  }

  /**
   * 发送物品通知
   * @param params 参数
   */
  public async sendItemNotification(params: {
    itemId: string
    type: string
    actorId: string
    actorName?: string
  }): Promise<any> {
    return this.callFunction('sendItemNotification', params)
  }
}

export default CloudUtils.getInstance()
