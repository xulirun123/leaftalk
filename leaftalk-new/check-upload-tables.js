const mysql = require('mysql2/promise');

async function checkUploadTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    });
    
    console.log('📋 检查文件上传相关的表:');
    
    // 检查所有表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('现有表:', tables.map(t => Object.values(t)[0]));
    
    // 检查是否有file_uploads表
    const uploadTables = tables.filter(t => Object.values(t)[0].includes('upload') || Object.values(t)[0].includes('file'));
    if (uploadTables.length > 0) {
        console.log('\n📁 文件上传相关表:');
        for (const table of uploadTables) {
            const tableName = Object.values(table)[0];
            console.log('表名:', tableName);
            
            // 检查表结构
            const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
            console.log('表结构:');
            structure.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type}`);
            });
            
            // 检查数据
            const [data] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`数据量: ${data[0].count} 条\n`);
        }
    } else {
        console.log('\n❌ 没有找到文件上传相关的表');
    }
    
    // 检查uploads目录
    console.log('📁 检查uploads目录:');
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
        console.log('✅ uploads目录存在');
        const files = fs.readdirSync(uploadsDir, { recursive: true });
        console.log(`文件数量: ${files.length}`);
        if (files.length > 0) {
            console.log('文件列表:');
            files.slice(0, 10).forEach(file => {
                console.log(`  ${file}`);
            });
            if (files.length > 10) {
                console.log(`  ... 还有 ${files.length - 10} 个文件`);
            }
        }
    } else {
        console.log('❌ uploads目录不存在');
    }
    
    await connection.end();
}

checkUploadTables();
