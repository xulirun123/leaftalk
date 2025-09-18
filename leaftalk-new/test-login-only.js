const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔐 测试登录...');
        
        const response = await axios.post('http://localhost:8893/api/auth/login', {
            username: 'YY0000006',
            password: 'password123'
        });
        
        console.log('✅ 登录成功:', response.data);
        
    } catch (error) {
        console.log('❌ 登录失败:');
        console.log('  状态码:', error.response?.status);
        console.log('  响应数据:', error.response?.data);
        console.log('  错误消息:', error.message);
    }
}

testLogin();
