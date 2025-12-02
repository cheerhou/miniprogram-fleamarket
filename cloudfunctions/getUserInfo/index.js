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

    try {
        // 尝试从 users 集合获取用户信息
        const result = await db.collection('users').where({
            _openid: openid
        }).get()

        if (result.data.length > 0) {
            return {
                success: true,
                data: result.data[0]
            }
        } else {
            // 如果没有用户信息，返回基本的 openid
            return {
                success: true,
                data: {
                    _openid: openid,
                    name: '微信用户',
                    avatar: '',
                    community: '未认证社区',
                    address: '未填写地址'
                },
                isNew: true
            }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        return {
            success: false,
            error: error.message,
            data: {
                _openid: openid,
                name: '微信用户',
                avatar: '',
                community: '未认证社区',
                address: '未填写地址'
            }
        }
    }
}
