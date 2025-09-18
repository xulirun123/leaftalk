const axios = require('axios');

const API_BASE = 'http://localhost:8893/api';

async function testAPI() {
    try {
        console.log('🔍 测试API功能...');
        
        // 1. 测试健康检查
        try {
            const healthResponse = await axios.get('http://localhost:8893/health');
            console.log('✅ 健康检查通过:', healthResponse.data);
        } catch (error) {
            console.log('❌ 健康检查失败:', error.message);
            return;
        }
        
        // 2. 测试登录
        console.log('\n🔐 测试登录...');
        try {
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                username: 'YY0000006', // 当前用户的叶语号
                password: 'password123'
            });
            
            console.log('✅ 登录成功:', {
                success: loginResponse.data.success,
                user: loginResponse.data.data.user.nickname,
                userId: loginResponse.data.data.user.id
            });
            
            const token = loginResponse.data.data.token;
            
            // 3. 测试联系人API
            console.log('\n👥 测试联系人API...');
            try {
                const contactsResponse = await axios.get(`${API_BASE}/contacts`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('✅ 联系人API响应:', {
                    success: contactsResponse.data.success,
                    contactCount: contactsResponse.data.data.length
                });
                
                if (contactsResponse.data.data.length > 0) {
                    console.log('📋 联系人列表:');
                    contactsResponse.data.data.forEach(contact => {
                        console.log(`  ${contact.nickname} (ID: ${contact.id})`);
                    });
                } else {
                    console.log('⚠️ 联系人列表为空');
                }
                
            } catch (error) {
                console.log('❌ 联系人API失败:', error.response?.data || error.message);
            }
            
        } catch (error) {
            console.log('❌ 登录失败:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 立即测试
testAPI();
