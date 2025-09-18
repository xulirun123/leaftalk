const axios = require('axios');

async function testYeyuCheck() {
    try {
        // 先登录获取token
        console.log('🔐 正在登录...');
        const loginResponse = await axios.post('http://localhost:8893/api/auth/login', {
            username: 'YYFSRATEHB',
            password: '123456'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ 登录成功，token:', token ? '已获取' : '未获取');
        
        if (!token) {
            console.error('❌ 未获取到token');
            return;
        }
        
        // 测试检查叶语号
        console.log('🔍 测试检查叶语号: YYD03YIHRY (应该已被使用)');
        const checkResponse = await axios.post('http://localhost:8893/api/user/check-yeyu-id', {
            yeyuId: 'YYD03YIHRY'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 检查结果:', checkResponse.data);
        
        // 测试检查一个不存在的叶语号
        console.log('🔍 测试检查叶语号: NEWTEST123 (应该可用)');
        const checkResponse2 = await axios.post('http://localhost:8893/api/user/check-yeyu-id', {
            yeyuId: 'NEWTEST123'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 检查结果:', checkResponse2.data);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
    }
}

testYeyuCheck();
