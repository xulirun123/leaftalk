const axios = require('axios');

async function testErrorHandling() {
    console.log('🧪 测试登录错误处理...');
    
    // 测试1: 不存在的用户
    console.log('\n1️⃣ 测试不存在的用户...');
    try {
        await axios.post('http://localhost:8893/api/auth/login', {
            username: 'nonexistent_user',
            password: 'password123'
        });
    } catch (error) {
        console.log('✅ 状态码:', error.response?.status);
        console.log('✅ 错误信息:', error.response?.data?.error);
    }
    
    // 测试2: 存在的用户，错误密码
    console.log('\n2️⃣ 测试错误密码...');
    try {
        await axios.post('http://localhost:8893/api/auth/login', {
            username: '17872886622',
            password: 'wrong_password'
        });
    } catch (error) {
        console.log('✅ 状态码:', error.response?.status);
        console.log('✅ 错误信息:', error.response?.data?.error);
    }
    
    // 测试3: 缺少用户名
    console.log('\n3️⃣ 测试缺少用户名...');
    try {
        await axios.post('http://localhost:8893/api/auth/login', {
            password: 'password123'
        });
    } catch (error) {
        console.log('✅ 状态码:', error.response?.status);
        console.log('✅ 错误信息:', error.response?.data?.error);
    }
    
    // 测试4: 缺少密码
    console.log('\n4️⃣ 测试缺少密码...');
    try {
        await axios.post('http://localhost:8893/api/auth/login', {
            username: '17872886622'
        });
    } catch (error) {
        console.log('✅ 状态码:', error.response?.status);
        console.log('✅ 错误信息:', error.response?.data?.error);
    }
    
    // 测试5: 正确的登录
    console.log('\n5️⃣ 测试正确登录...');
    try {
        const response = await axios.post('http://localhost:8893/api/auth/login', {
            username: '17872886622',
            password: 'password123'
        });
        console.log('✅ 登录成功:', response.data.success);
        console.log('✅ 用户信息:', response.data.data?.user?.nickname);
    } catch (error) {
        console.log('❌ 意外错误:', error.response?.data);
    }
}

testErrorHandling();
