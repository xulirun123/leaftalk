#!/usr/bin/env node

/**
 * 删除数据库中的旧结构，只保留新项目需要的核心表
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'leaftalk-new',
    charset: 'utf8mb4'
}

async function cleanupOldStructures() {
    let connection

    try {
        console.log('🧹 开始清理数据库中的旧结构...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 获取当前所有表
        console.log('📊 检查当前数据库表...')
        const [tables] = await connection.query('SHOW TABLES')
        const allTables = tables.map(row => Object.values(row)[0])
        
        console.log(`当前数据库有 ${allTables.length} 个表`)

        // 2. 定义新项目需要的核心表
        const coreTables = [
            // 用户系统
            'users',
            'user_settings',
            'user_avatars',
            
            // 好友系统
            'friend_requests',
            'contacts',
            
            // 聊天系统
            'conversations',
            'conversation_members',
            'messages',
            'user_conversations',
            
            // 朋友圈系统
            'moments',
            'moment_interactions',
            
            // 族谱系统
            'genealogies',
            'genealogy_members',
            'genealogy_invitations',
            
            // 视频系统
            'videos',
            'video_channels',
            'video_interactions',
            
            // 支付系统
            'wallets',
            'transactions',
            'transfers',
            'red_packets',
            'red_packet_records',
            
            // 媒体文件
            'media_files',
            
            // 通知系统
            'system_notifications',
            'user_notification_records',
            
            // 隐私设置
            'privacy_settings',
            
            // 位置信息
            'locations'
        ]

        // 3. 识别需要删除的旧表
        const tablesToDelete = allTables.filter(table => !coreTables.includes(table))
        
        console.log('\n📋 核心表 (保留):')
        coreTables.forEach(table => {
            const exists = allTables.includes(table)
            console.log(`  ${exists ? '✅' : '❌'} ${table}`)
        })

        console.log(`\n🗑️ 需要删除的旧表 (${tablesToDelete.length}个):`)
        tablesToDelete.forEach(table => {
            console.log(`  🔸 ${table}`)
        })

        // 4. 确认删除
        if (tablesToDelete.length === 0) {
            console.log('\n✅ 没有需要删除的旧表')
            return
        }

        console.log(`\n⚠️ 即将删除 ${tablesToDelete.length} 个旧表...`)
        
        // 5. 禁用外键检查并删除旧表
        console.log('🔄 禁用外键检查...')
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')

        let deletedCount = 0
        let failedCount = 0

        for (const table of tablesToDelete) {
            try {
                console.log(`🗑️ 删除表: ${table}`)
                await connection.query(`DROP TABLE IF EXISTS \`${table}\``)
                deletedCount++
                console.log(`  ✅ ${table} 删除成功`)
            } catch (error) {
                failedCount++
                console.error(`  ❌ ${table} 删除失败: ${error.message}`)
            }
        }

        // 6. 重新启用外键检查
        console.log('🔄 重新启用外键检查...')
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 7. 验证清理结果
        console.log('\n🔍 验证清理结果...')
        const [finalTables] = await connection.query('SHOW TABLES')
        const finalTableNames = finalTables.map(row => Object.values(row)[0])

        console.log('\n📊 清理统计:')
        console.log(`  - 原始表数量: ${allTables.length}`)
        console.log(`  - 删除成功: ${deletedCount}`)
        console.log(`  - 删除失败: ${failedCount}`)
        console.log(`  - 最终表数量: ${finalTableNames.length}`)

        console.log('\n📋 最终保留的表:')
        finalTableNames.sort().forEach((table, index) => {
            console.log(`  ${(index + 1).toString().padStart(2, '0')}. ${table}`)
        })

        // 8. 检查数据完整性
        console.log('\n🔍 检查核心表数据...')
        const dataCheck = {}
        
        for (const table of coreTables) {
            if (finalTableNames.includes(table)) {
                try {
                    const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``)
                    dataCheck[table] = count[0].count
                } catch (error) {
                    dataCheck[table] = '查询失败'
                }
            } else {
                dataCheck[table] = '表不存在'
            }
        }

        console.log('\n📊 核心表数据统计:')
        Object.entries(dataCheck).forEach(([table, count]) => {
            console.log(`  ${table}: ${count}`)
        })

        console.log('\n🎉 数据库旧结构清理完成！')
        console.log('✅ 现在数据库只包含新项目需要的核心表')
        console.log('🚀 可以重启服务器测试功能了')

    } catch (error) {
        console.error('❌ 清理失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await cleanupOldStructures()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { cleanupOldStructures }
