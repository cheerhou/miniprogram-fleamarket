// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const { itemId } = event
    const openid = wxContext.OPENID

    try {
        if (!itemId) {
            return {
                success: false,
                message: '物品ID不能为空'
            }
        }

        // 获取物品信息
        const itemResult = await db.collection('items').doc(itemId).get()
        if (!itemResult.data) {
            return {
                success: false,
                message: '物品不存在'
            }
        }

        const item = itemResult.data

        // 验证是否为发布者
        if (item._openid !== openid) {
            return {
                success: false,
                message: '无权限操作此物品'
            }
        }

        // 更新状态
        await db.collection('items').doc(itemId).update({
            data: {
                status: 'sold',
                lockInfo: null, // 清除锁定信息
                updateTime: new Date()
            }
        })

        return {
            success: true,
            message: '标记成功'
        }

    } catch (error) {
        console.error('标记售出失败:', error)
        return {
            success: false,
            message: '操作失败',
            error: error.message
        }
    }
}
