const mysql = require('mysql2/promise')

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'leaftalk-new',
    charset: 'utf8mb4'
}

async function addTestMoments() {
    let connection
    try {
        console.log('🔄 连接数据库...')
        connection = await mysql.createConnection(dbConfig)
        
        // 检查是否有用户
        const [users] = await connection.execute('SELECT id, nickname, avatar FROM users LIMIT 5')
        if (users.length === 0) {
            console.log('❌ 没有找到用户，请先创建用户')
            return
        }

        console.log(`✅ 找到 ${users.length} 个用户`)
        users.forEach(user => {
            console.log(`  - 用户ID: ${user.id}, 昵称: ${user.nickname}`)
        })
        
        // 检查是否已有朋友圈数据
        const [existingMoments] = await connection.execute('SELECT COUNT(*) as count FROM moments')
        console.log(`📊 当前朋友圈数量: ${existingMoments[0].count}`)
        
        // 生成唯一ID的函数
        const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

        // 添加测试朋友圈数据
        const testMoments = [
            {
                id: generateId(),
                user_id: users[0].id.toString(),
                user_name: users[0].nickname,
                user_avatar: users[0].avatar || '/default-avatar.png',
                content: '今天天气真好，出来散散步 🌞',
                images: JSON.stringify(['/uploads/test1.jpg']),
                videos: JSON.stringify([]),
                location: '北京市朝阳区',
                privacy: 'friends',
                likes: JSON.stringify([]),
                comments: JSON.stringify([]),
                like_count: 0,
                comment_count: 0,
                view_count: 0,
                is_pinned: false,
                status: 'published'
            },
            {
                id: generateId(),
                user_id: users[0].id.toString(),
                user_name: users[0].nickname,
                user_avatar: users[0].avatar || '/default-avatar.png',
                content: '分享一张美食照片 🍕',
                images: JSON.stringify(['/uploads/test2.jpg', '/uploads/test3.jpg']),
                videos: JSON.stringify([]),
                location: '上海市浦东新区',
                privacy: 'friends',
                likes: JSON.stringify([]),
                comments: JSON.stringify([]),
                like_count: 0,
                comment_count: 0,
                view_count: 0,
                is_pinned: false,
                status: 'published'
            }
        ]

        if (users.length > 1) {
            testMoments.push({
                id: generateId(),
                user_id: users[1].id.toString(),
                user_name: users[1].nickname,
                user_avatar: users[1].avatar || '/default-avatar.png',
                content: '工作中的小确幸 💼',
                images: JSON.stringify([]),
                videos: JSON.stringify([]),
                location: '深圳市南山区',
                privacy: 'friends',
                likes: JSON.stringify([]),
                comments: JSON.stringify([]),
                like_count: 0,
                comment_count: 0,
                view_count: 0,
                is_pinned: false,
                status: 'published'
            })
        }
        
        console.log('🔄 添加测试朋友圈数据...')
        for (const moment of testMoments) {
            await connection.execute(`
                INSERT INTO moments (id, user_id, user_name, user_avatar, content, images, videos, location, privacy, likes, comments, like_count, comment_count, view_count, is_pinned, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                moment.id,
                moment.user_id,
                moment.user_name,
                moment.user_avatar,
                moment.content,
                moment.images,
                moment.videos,
                moment.location,
                moment.privacy,
                moment.likes,
                moment.comments,
                moment.like_count,
                moment.comment_count,
                moment.view_count,
                moment.is_pinned,
                moment.status
            ])
        }
        
        console.log(`✅ 成功添加 ${testMoments.length} 条测试朋友圈`)
        
        // 验证数据
        const [newMoments] = await connection.execute(`
            SELECT * FROM moments
            ORDER BY created_at DESC
        `)

        console.log('📋 当前朋友圈列表:')
        newMoments.forEach((moment, index) => {
            console.log(`  ${index + 1}. ${moment.user_name}: ${moment.content}`)
        })
        
    } catch (error) {
        console.error('❌ 添加测试数据失败:', error)
    } finally {
        if (connection) {
            await connection.end()
            console.log('🔚 数据库连接已关闭')
        }
    }
}

// 运行脚本
addTestMoments()
