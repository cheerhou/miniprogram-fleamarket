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
        // 检查用户是否已存在
        const checkResult = await db.collection('users').where({
            _openid: openid
        }).get()

        if (checkResult.data.length > 0) {
            return {
                success: false,
                message: '用户已存在'
            }
        }

        // 创建新用户
        const result = await db.collection('users').add({
            data: {
                _openid: openid,
                name,
                community,
                address,
                avatar: avatar || '',
                createTime: db.serverDate(),
                updateTime: db.serverDate()
            }
        })

        return {
            success: true,
            data: result
        }
    } catch (error) {
        console.error('注册用户失败:', error)
        return {
            success: false,
            error: error.message,
            message: '注册失败'
        }
    }
}
