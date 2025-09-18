const mysql = require('mysql2/promise');

async function compareConnections() {
    console.log('🔍 比较不同的数据库连接方式...');
    
    const baseConfig = {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    };
    
    // 1. 测试单个连接（我们知道这个工作）
    console.log('\n1️⃣ 测试单个连接...');
    try {
        const connection = await mysql.createConnection(baseConfig);
        const [result] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log('✅ 单个连接成功，用户数:', result[0].count);
        await connection.end();
    } catch (error) {
        console.log('❌ 单个连接失败:', error.message);
    }
    
    // 2. 测试连接池（服务器使用的方式）
    console.log('\n2️⃣ 测试连接池...');
    try {
        const poolConfig = {
            ...baseConfig,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000
        };
        
        const pool = mysql.createPool(poolConfig);
        const [result] = await pool.execute('SELECT COUNT(*) as count FROM users');
        console.log('✅ 连接池成功，用户数:', result[0].count);
        await pool.end();
    } catch (error) {
        console.log('❌ 连接池失败:', error.message);
        console.log('错误代码:', error.code);
    }
    
    // 3. 测试简化的连接池配置
    console.log('\n3️⃣ 测试简化连接池配置...');
    try {
        const simplePoolConfig = {
            ...baseConfig,
            connectionLimit: 5
        };
        
        const pool = mysql.createPool(simplePoolConfig);
        const [result] = await pool.execute('SELECT COUNT(*) as count FROM users');
        console.log('✅ 简化连接池成功，用户数:', result[0].count);
        await pool.end();
    } catch (error) {
        console.log('❌ 简化连接池失败:', error.message);
        console.log('错误代码:', error.code);
    }
    
    // 4. 测试环境变量
    console.log('\n4️⃣ 检查环境变量...');
    console.log('DB_HOST:', process.env.DB_HOST || '未设置');
    console.log('DB_USER:', process.env.DB_USER || '未设置');
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '未设置');
    console.log('DB_NAME:', process.env.DB_NAME || '未设置');
}

compareConnections();
