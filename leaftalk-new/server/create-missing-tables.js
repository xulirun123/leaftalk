/**
 * 创建缺失的重要表
 * 补充合并过程中因外键约束失败的表
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'leaftalk-new',
    charset: 'utf8mb4'
}

async function createMissingTables() {
    let connection
    
    try {
        console.log('🔄 连接到数据库...')
        connection = await mysql.createConnection(dbConfig)
        
        console.log('📋 创建缺失的重要表...')
        
        // 1. 好友系统表
        console.log('👥 创建好友系统表...')
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS friendships (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                friend_id INT NOT NULL,
                status ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'accepted',
                remark VARCHAR(100) COMMENT '好友备注',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_friendship (user_id, friend_id)
            ) COMMENT='好友关系表'
        `)
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS friend_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                from_user_id INT NOT NULL,
                to_user_id INT NOT NULL,
                message TEXT,
                status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT='好友请求表'
        `)
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS blacklist (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                blocked_user_id INT NOT NULL,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_block (user_id, blocked_user_id)
            ) COMMENT='黑名单表'
        `)
        
        // 2. 聊天系统表
        console.log('💬 创建聊天系统表...')
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                type ENUM('private', 'group') NOT NULL,
                name VARCHAR(100),
                avatar TEXT,
                description TEXT,
                creator_id INT,
                last_message_id INT,
                last_message_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
            ) COMMENT='会话表'
        `)
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS conversation_members (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('member', 'admin', 'owner') DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_read_at TIMESTAMP NULL,
                is_muted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_member (conversation_id, user_id)
            ) COMMENT='会话成员表'
        `)
        
        // 3. 朋友圈系统表
        console.log('📸 创建朋友圈系统表...')
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS moment_likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moment_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (moment_id, user_id)
            ) COMMENT='朋友圈点赞表'
        `)
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS moment_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moment_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                reply_to_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reply_to_id) REFERENCES moment_comments(id) ON DELETE CASCADE
            ) COMMENT='朋友圈评论表'
        `)
        
        // 4. 家谱系统表
        console.log('🌳 创建家谱系统表...')
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS genealogies (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                creator_id INT NOT NULL,
                patriarch_id INT,
                is_main BOOLEAN DEFAULT FALSE,
                status ENUM('active', 'archived') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (patriarch_id) REFERENCES users(id) ON DELETE SET NULL
            ) COMMENT='家谱表'
        `)
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS genealogy_members (
                id INT PRIMARY KEY AUTO_INCREMENT,
                genealogy_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('member', 'admin', 'patriarch') DEFAULT 'member',
                generation INT DEFAULT 1,
                position_in_generation INT DEFAULT 1,
                father_id INT,
                mother_id INT,
                spouse_id INT,
                is_deceased BOOLEAN DEFAULT FALSE,
                birth_date DATE,
                death_date DATE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (genealogy_id) REFERENCES genealogies(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (father_id) REFERENCES genealogy_members(id) ON DELETE SET NULL,
                FOREIGN KEY (mother_id) REFERENCES genealogy_members(id) ON DELETE SET NULL,
                FOREIGN KEY (spouse_id) REFERENCES genealogy_members(id) ON DELETE SET NULL,
                UNIQUE KEY unique_member (genealogy_id, user_id)
            ) COMMENT='家谱成员表'
        `)
        
        // 5. 支付系统表
        console.log('💰 创建支付系统表...')
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_wallets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                wallet_id INT NOT NULL,
                balance DECIMAL(10,2) DEFAULT 0.00,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_wallet (user_id, wallet_id)
            ) COMMENT='用户钱包关联表'
        `)
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                description TEXT,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT='交易记录表'
        `)
        
        // 6. 媒体文件表
        console.log('📁 创建媒体文件表...')
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS media_files (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                file_path TEXT NOT NULL,
                file_size BIGINT,
                mime_type VARCHAR(100),
                type ENUM('image', 'video', 'audio', 'document') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT='媒体文件表'
        `)

        // 叶语号修改历史表
        console.log('🆔 创建叶语号修改历史表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS yeyu_id_changes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                old_yeyu_id VARCHAR(50) NOT NULL,
                new_yeyu_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_year (user_id, created_at)
            ) COMMENT='叶语号修改历史表'
        `)

        console.log('✅ 所有缺失表创建完成')
        
        // 获取最终统计
        const [tableCount] = await connection.execute('SHOW TABLES')
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users')
        
        console.log(`📊 最终统计:`)
        console.log(`   📋 表数量: ${tableCount.length}`)
        console.log(`   👤 用户数量: ${userCount[0].count}`)
        
        console.log(`📋 完整表列表:`)
        tableCount.forEach((table, index) => {
            const tableName = table[`Tables_in_leaftalk-new`]
            console.log(`   ${index + 1}. ${tableName}`)
        })
        
    } catch (error) {
        console.error('❌ 创建表失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    createMissingTables()
        .then(() => {
            console.log('🎉 缺失表创建成功！')
            process.exit(0)
        })
        .catch((error) => {
            console.error('💥 创建表失败:', error)
            process.exit(1)
        })
}

module.exports = { createMissingTables }
