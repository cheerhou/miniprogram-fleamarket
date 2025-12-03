// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { name, community, address, avatar } = event

    try {
        // 更新用户信息
        const result = await db.collection('users').where({
            _openid: openid
        }).update({
            data: {
                name,
                community,
                address,
                avatar: avatar || '',
                updateTime: db.serverDate()
            }
        })

        return {
            success: true,
            data: result
        }
    } catch (error) {
        console.error('更新用户信息失败:', error)
        return {
            success: false,
            error: error.message,
            message: '更新失败'
        }
    }
}
