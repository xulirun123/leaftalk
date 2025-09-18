// 测试组件导入
console.log('🔍 测试组件导入...');

// 检查文件是否存在
const fs = require('fs');
const path = require('path');

const componentPath = 'src/modules/settings/pages/Notifications.vue';
const storePath = 'src/stores/notification.ts';
const togglePath = 'src/shared/components/common/ToggleSwitch.vue';

console.log('\n📁 检查文件存在性:');
[componentPath, storePath, togglePath].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath} 存在`);
  } else {
    console.log(`❌ ${filePath} 不存在`);
  }
});

console.log('\n🔍 检查文件内容:');

// 检查 Notifications.vue
try {
  const notificationsContent = fs.readFileSync(componentPath, 'utf8');
  
  // 检查关键导入
  const imports = [
    'useNotificationStore',
    'ToggleSwitch',
    'useRouter',
    'ref, computed, onMounted'
  ];
  
  console.log('\n📋 Notifications.vue 导入检查:');
  imports.forEach(imp => {
    if (notificationsContent.includes(imp)) {
      console.log(`✅ 包含 ${imp}`);
    } else {
      console.log(`❌ 缺少 ${imp}`);
    }
  });
  
  // 检查模板语法
  if (notificationsContent.includes('<template>') && notificationsContent.includes('</template>')) {
    console.log('✅ 模板结构正确');
  } else {
    console.log('❌ 模板结构有问题');
  }
  
  // 检查脚本语法
  if (notificationsContent.includes('<script setup lang="ts">') && notificationsContent.includes('</script>')) {
    console.log('✅ 脚本结构正确');
  } else {
    console.log('❌ 脚本结构有问题');
  }
  
} catch (error) {
  console.log(`❌ 读取 ${componentPath} 失败:`, error.message);
}

// 检查 notification store
try {
  const storeContent = fs.readFileSync(storePath, 'utf8');
  
  const storeFeatures = [
    'defineStore',
    'NotificationSettings',
    'settings',
    'updateSetting',
    'init'
  ];
  
  console.log('\n📋 notification store 检查:');
  storeFeatures.forEach(feature => {
    if (storeContent.includes(feature)) {
      console.log(`✅ 包含 ${feature}`);
    } else {
      console.log(`❌ 缺少 ${feature}`);
    }
  });
  
} catch (error) {
  console.log(`❌ 读取 ${storePath} 失败:`, error.message);
}

// 检查 ToggleSwitch
try {
  const toggleContent = fs.readFileSync(togglePath, 'utf8');
  
  if (toggleContent.includes('modelValue') && toggleContent.includes('update:modelValue')) {
    console.log('✅ ToggleSwitch 组件结构正确');
  } else {
    console.log('❌ ToggleSwitch 组件结构有问题');
  }
  
} catch (error) {
  console.log(`❌ 读取 ${togglePath} 失败:`, error.message);
}

console.log('\n🎯 建议解决方案:');
console.log('1. 清除浏览器缓存');
console.log('2. 重启开发服务器');
console.log('3. 检查网络连接');
console.log('4. 确保所有依赖都已安装');

console.log('\n✅ 组件导入测试完成');
