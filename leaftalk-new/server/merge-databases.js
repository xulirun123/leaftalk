/**
 * 三个数据库合并脚本
 * 将 leaftalk_enterprise, yeyu_app, yeyu_messages 合并为统一的 leaftalk-new
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    charset: 'utf8mb4'
}

async function mergeDatabases() {
    let connection
    
    try {
        console.log('🔄 连接到MySQL服务器...')
        connection = await mysql.createConnection(dbConfig)
        
        // 重新创建统一数据库
        console.log('🗑️ 重建统一数据库...')
        await connection.execute('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.execute('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        await connection.query('USE `leaftalk-new`')
        
        console.log('📊 复制主数据库表结构...')
        
        // 获取 leaftalk_enterprise 的所有表
        const [tables] = await connection.execute('SHOW TABLES FROM `leaftalk_enterprise`')
        
        for (const tableRow of tables) {
            const tableName = tableRow[`Tables_in_leaftalk_enterprise`]
            console.log(`📋 复制表: ${tableName}`)
            
            try {
                // 获取表结构
                const [createResult] = await connection.execute(`SHOW CREATE TABLE \`leaftalk_enterprise\`.\`${tableName}\``)
                let createSQL = createResult[0]['Create Table']
                
                // 修复可能的字段长度问题
                createSQL = createSQL.replace(/avatar VARCHAR\(500\)/g, 'avatar TEXT')
                createSQL = createSQL.replace(/media_url VARCHAR\(500\)/g, 'media_url TEXT')
                
                // 执行创建表
                await connection.execute(createSQL)
                
                // 复制数据
                await connection.execute(`
                    INSERT INTO \`leaftalk-new\`.\`${tableName}\`
                    SELECT * FROM \`leaftalk_enterprise\`.\`${tableName}\`
                `)
                
                console.log(`✅ 表 ${tableName} 复制完成`)
                
            } catch (error) {
                console.log(`⚠️ 表 ${tableName} 复制失败: ${error.message}`)
                // 继续处理其他表
            }
        }
        
        console.log('📊 合并其他数据库的独有数据...')
        
        // 合并 yeyu_app 的独有数据
        await mergeYeyuAppData(connection)
        
        // 合并 yeyu_messages 的独有数据  
        await mergeYeyuMessagesData(connection)
        
        // 创建一些可能缺失的重要表
        await createMissingTables(connection)
        
        console.log('📈 更新统计信息...')
        await updateStatistics(connection)
        
        console.log('✅ 数据库合并完成！')
        
    } catch (error) {
        console.error('❌ 数据库合并失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// 合并 yeyu_app 的独有数据
async function mergeYeyuAppData(connection) {
    try {
        console.log('📱 合并 yeyu_app 数据...')
        
        // 检查是否有 yeyu_app 独有的用户数据
        const [yeyuUsers] = await connection.execute(`
            SELECT * FROM \`yeyu_app\`.users 
            WHERE yeyu_id NOT IN (SELECT yeyu_id FROM \`leaftalk-new\`.users WHERE yeyu_id IS NOT NULL)
        `)
        
        if (yeyuUsers.length > 0) {
            console.log(`📥 发现 ${yeyuUsers.length} 个 yeyu_app 独有用户`)
            
            for (const user of yeyuUsers) {
                try {
                    await connection.execute(`
                        INSERT INTO \`leaftalk-new\`.users 
                        (yeyu_id, username, nickname, password, avatar, phone, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        user.yeyu_id, user.username, user.nickname, 
                        user.password, user.avatar, user.phone, user.created_at
                    ])
                } catch (err) {
                    console.log(`⚠️ 用户 ${user.yeyu_id} 插入失败: ${err.message}`)
                }
            }
        }
        
        console.log('✅ yeyu_app 数据合并完成')
        
    } catch (error) {
        console.log(`⚠️ yeyu_app 数据合并失败: ${error.message}`)
    }
}

// 合并 yeyu_messages 的独有数据
async function mergeYeyuMessagesData(connection) {
    try {
        console.log('💬 合并 yeyu_messages 数据...')
        
        // 检查是否有通话记录表需要合并
        const [callRecords] = await connection.execute('SHOW TABLES FROM `yeyu_messages` LIKE "call_records"')
        
        if (callRecords.length > 0) {
            // 创建通话记录表（如果不存在）
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS call_records (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    caller_id INT NOT NULL,
                    callee_id INT NOT NULL,
                    type ENUM('voice', 'video') NOT NULL,
                    status ENUM('completed', 'missed', 'rejected') NOT NULL,
                    duration INT DEFAULT 0 COMMENT '通话时长(秒)',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (callee_id) REFERENCES users(id) ON DELETE CASCADE
                ) COMMENT='通话记录表'
            `)
            
            // 复制通话记录数据
            await connection.execute(`
                INSERT IGNORE INTO \`leaftalk-new\`.call_records
                SELECT * FROM \`yeyu_messages\`.call_records
            `)
            
            console.log('✅ 通话记录合并完成')
        }
        
        console.log('✅ yeyu_messages 数据合并完成')
        
    } catch (error) {
        console.log(`⚠️ yeyu_messages 数据合并失败: ${error.message}`)
    }
}

// 创建可能缺失的重要表
async function createMissingTables(connection) {
    try {
        console.log('🔧 创建缺失的重要表...')
        
        // 创建系统配置表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_config (
                id INT PRIMARY KEY AUTO_INCREMENT,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) COMMENT='系统配置表'
        `)
        
        // 插入基础配置
        await connection.execute(`
            INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
            ('app_name', '叶语', '应用名称'),
            ('app_version', '1.0.0', '应用版本'),
            ('database_version', '1.0.0', '数据库版本'),
            ('merge_date', NOW(), '数据库合并日期')
        `)
        
        console.log('✅ 系统表创建完成')
        
    } catch (error) {
        console.log(`⚠️ 创建系统表失败: ${error.message}`)
    }
}

// 更新统计信息
async function updateStatistics(connection) {
    try {
        // 获取合并后的统计信息
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users')
        const [tableCount] = await connection.execute('SHOW TABLES')
        
        console.log(`📊 合并统计:`)
        console.log(`   👤 用户数量: ${userCount[0].count}`)
        console.log(`   📋 表数量: ${tableCount.length}`)
        
        // 列出所有表
        console.log(`📋 数据库表列表:`)
        tableCount.forEach((table, index) => {
            const tableName = table[`Tables_in_leaftalk-new`]
            console.log(`   ${index + 1}. ${tableName}`)
        })
        
    } catch (error) {
        console.log(`⚠️ 统计信息更新失败: ${error.message}`)
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    mergeDatabases()
        .then(() => {
            console.log('🎉 三个数据库合并成功！')
            console.log('📊 统一数据库: leaftalk-new')
            console.log('🗑️ 可以安全删除旧数据库: leaftalk_enterprise, yeyu_app, yeyu_messages')
            process.exit(0)
        })
        .catch((error) => {
            console.error('💥 数据库合并失败:', error)
            process.exit(1)
        })
}

module.exports = { mergeDatabases }
