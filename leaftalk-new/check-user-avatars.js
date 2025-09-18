const mysql = require('mysql2/promise');

async function checkUserAvatars() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'leaftalk-new',
        charset: 'utf8mb4'
    });
    
    console.log('📋 检查用户头像表:');
    
    // 检查user_avatars表结构
    const [structure] = await connection.execute('DESCRIBE user_avatars');
    console.log('user_avatars表结构:');
    structure.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type}`);
    });
    
    // 检查数据
    const [avatars] = await connection.execute('SELECT * FROM user_avatars');
    console.log(`\n📊 user_avatars数据量: ${avatars.length} 条`);
    
    if (avatars.length > 0) {
        console.log('头像数据:');
        avatars.forEach(avatar => {
            console.log(`  用户ID: ${avatar.user_id}, 头像路径: ${avatar.avatar_path}, 创建时间: ${avatar.created_at}`);
        });
    }
    
    // 检查file_storage表中的头像文件
    console.log('\n📋 检查file_storage表中的头像文件:');
    const [files] = await connection.execute("SELECT * FROM file_storage WHERE file_type = 'avatar' OR original_name LIKE '%avatar%'");
    console.log(`头像文件数量: ${files.length} 条`);
    
    if (files.length > 0) {
        console.log('头像文件:');
        files.forEach(file => {
            console.log(`  文件ID: ${file.file_id}, 上传者: ${file.uploader_id}, 文件名: ${file.original_name}, 路径: ${file.file_path}`);
        });
    }
    
    // 检查uploads/avatars目录
    console.log('\n📁 检查uploads/avatars目录:');
    const fs = require('fs');
    const path = require('path');
    
    const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
    if (fs.existsSync(avatarsDir)) {
        console.log('✅ uploads/avatars目录存在');
        const files = fs.readdirSync(avatarsDir);
        console.log(`头像文件数量: ${files.length}`);
        if (files.length > 0) {
            console.log('头像文件列表:');
            files.forEach(file => {
                const filePath = path.join(avatarsDir, file);
                const stats = fs.statSync(filePath);
                console.log(`  ${file} (${Math.round(stats.size / 1024)}KB, ${stats.mtime.toLocaleString()})`);
            });
        }
    } else {
        console.log('❌ uploads/avatars目录不存在');
    }
    
    await connection.end();
}

checkUserAvatars();
