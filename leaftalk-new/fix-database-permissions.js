const mysql = require('mysql2/promise');

async function fixDatabasePermissions() {
    console.log('🔧 开始修复数据库权限问题...');
    
    // 尝试不同的连接配置
    const connectionConfigs = [
        {
            name: '当前配置 (root/password)',
            config: {
                host: 'localhost',
                user: 'root',
                password: 'password',
                charset: 'utf8mb4'
            }
        },
        {
            name: '无密码 root',
            config: {
                host: 'localhost',
                user: 'root',
                password: '',
                charset: 'utf8mb4'
            }
        },
        {
            name: '默认密码 root',
            config: {
                host: 'localhost',
                user: 'root',
                password: 'root',
                charset: 'utf8mb4'
            }
        }
    ];
    
    let workingConnection = null;
    let workingConfig = null;
    
    // 测试连接配置
    for (const { name, config } of connectionConfigs) {
        try {
            console.log(`\n🔍 测试连接: ${name}`);
            const connection = await mysql.createConnection(config);
            
            // 测试基本查询
            await connection.execute('SELECT 1');
            console.log(`✅ ${name} - 连接成功`);
            
            workingConnection = connection;
            workingConfig = config;
            break;
            
        } catch (error) {
            console.log(`❌ ${name} - 连接失败: ${error.message}`);
        }
    }
    
    if (!workingConnection) {
        console.log('\n❌ 所有连接配置都失败了。请检查：');
        console.log('1. MySQL服务是否正在运行');
        console.log('2. MySQL root用户的密码');
        console.log('3. 是否需要重置MySQL密码');
        return;
    }
    
    console.log(`\n✅ 使用工作配置: ${workingConfig.user}@${workingConfig.host}`);
    
    try {
        // 检查当前用户权限
        console.log('\n🔍 检查当前用户权限...');
        const [grants] = await workingConnection.execute('SHOW GRANTS');
        console.log('当前用户权限:');
        grants.forEach(grant => {
            console.log(`  ${Object.values(grant)[0]}`);
        });
        
        // 检查数据库是否存在
        console.log('\n🔍 检查数据库...');
        const [databases] = await workingConnection.execute('SHOW DATABASES');
        const dbNames = databases.map(db => Object.values(db)[0]);
        console.log('现有数据库:', dbNames);
        
        if (!dbNames.includes('leaftalk-new')) {
            console.log('\n📋 创建 leaftalk-new 数据库...');
            await workingConnection.execute('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            console.log('✅ 数据库创建成功');
        } else {
            console.log('✅ leaftalk-new 数据库已存在');
        }
        
        // 确保用户有数据库权限
        console.log('\n🔧 确保用户权限...');
        
        if (workingConfig.user === 'root') {
            console.log('✅ Root用户已有所有权限');
        } else {
            // 为非root用户授权
            await workingConnection.execute(`GRANT ALL PRIVILEGES ON \`leaftalk-new\`.* TO '${workingConfig.user}'@'localhost'`);
            await workingConnection.execute('FLUSH PRIVILEGES');
            console.log('✅ 用户权限已更新');
        }
        
        // 测试对目标数据库的访问
        console.log('\n🔍 测试数据库访问...');
        await workingConnection.execute('USE `leaftalk-new`');
        
        // 测试表操作权限
        const [tables] = await workingConnection.execute('SHOW TABLES');
        console.log(`✅ 数据库访问成功，包含 ${tables.length} 个表`);
        
        // 测试用户表查询
        try {
            const [users] = await workingConnection.execute('SELECT COUNT(*) as count FROM users');
            console.log(`✅ 用户表访问成功，包含 ${users[0].count} 个用户`);
        } catch (error) {
            console.log(`⚠️ 用户表访问失败: ${error.message}`);
        }
        
        // 更新服务器配置文件（如果需要）
        if (workingConfig.password !== 'password') {
            console.log('\n📝 需要更新服务器配置...');
            console.log('请在服务器配置中使用以下数据库配置:');
            console.log(`  DB_HOST: ${workingConfig.host}`);
            console.log(`  DB_USER: ${workingConfig.user}`);
            console.log(`  DB_PASSWORD: ${workingConfig.password}`);
            console.log(`  DB_NAME: leaftalk-new`);
        }
        
        await workingConnection.end();
        console.log('\n✅ 数据库权限修复完成！');
        
    } catch (error) {
        console.error('\n❌ 修复过程中出错:', error.message);
        if (workingConnection) {
            await workingConnection.end();
        }
    }
}

fixDatabasePermissions();
