import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 开始上传Vue3核心assets文件...');

const SERVER_IP = '120.24.148.204';
const SERVER_USER = 'root';
const SERVER_PASSWORD = '314077060@qq.com';
const ASSETS_PATH = './leaftalk-new/dist/assets';

// 核心文件列表（按重要性排序）
const coreFiles = [
  // Vue核心文件
  'vue-vendor-DABdf7_n.js',
  'utils-vendor-C-1G2k3o.js',
  'ui-vendor-l0sNRNKZ.js',
  
  // 主要CSS文件
  'index-DOgKTxJ-.css',
  'index-DZfugxdK.css',
  
  // 主要JS文件
  'index-D-bMfwyM.js',
  'index-DBKiyhZ5.js',
  'index-Dql8rQ5C.js',
  
  // 核心功能模块
  'Login-BpvNphd9.js',
  'Login-Bv-TjxLk.css',
  'Register-FleVQBxX.js',
  'Register-B3DZQ35Z.css',
  'MobileContacts-BGJQSG2B.js',
  'MobileContacts-OsTRwMHv.css',
  'MobileDiscover-jkHYisd7.js',
  'MobileDiscover-BPkOF9kq.css',
  'MobileProfile-C0YawWv6.js',
  'MobileProfile-36aLFmrU.css',
  'Genealogy-Di3J6i6R.js',
  'Genealogy-DXfsbdq-.css',
  
  // 聊天功能
  'ChatSimple-a4dWlnvK.js',
  'ChatSimple-BhfwJ5eB.css',
  'CreateGroup--CUc3KLA.js',
  'CreateGroup-DS-zQ4o6.css',
  
  // 设置功能
  'Settings-DLY7STTT.js',
  'Settings-CwvILkem.css',
  
  // API和服务
  'contactsApi-CwPTTazW.js',
  'api-B5G_2fVU.js',
  
  // 工具和组合式函数
  'useI18n-BkLp4UHZ.js',
  'useSmartAuth-DdAcIu0G.js',
  'useUnifiedAvatar-BiTSbu0j.js'
];

try {
  // 检查assets目录
  if (!fs.existsSync(ASSETS_PATH)) {
    throw new Error('❌ assets目录不存在');
  }

  const allFiles = fs.readdirSync(ASSETS_PATH);
  console.log(`📁 发现 ${allFiles.length} 个assets文件`);

  // 上传核心文件
  console.log('📤 开始上传核心文件...');
  let uploadedCount = 0;
  
  for (const file of coreFiles) {
    const filePath = path.join(ASSETS_PATH, file);
    if (fs.existsSync(filePath)) {
      try {
        console.log(`📄 上传 ${file}...`);
        execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no "${filePath}" ${SERVER_USER}@${SERVER_IP}:/var/www/leaftalk/frontend/assets/`, {
          stdio: 'pipe'
        });
        uploadedCount++;
      } catch (error) {
        console.log(`⚠️ 上传 ${file} 失败，跳过...`);
      }
    } else {
      console.log(`⚠️ 文件 ${file} 不存在，跳过...`);
    }
  }

  console.log(`✅ 核心文件上传完成！成功上传 ${uploadedCount} 个文件`);

  // 上传剩余的重要文件（分批处理）
  const remainingFiles = allFiles.filter(file => !coreFiles.includes(file));
  console.log(`📦 开始上传剩余 ${remainingFiles.length} 个文件...`);

  const batchSize = 5;
  let remainingUploaded = 0;
  
  for (let i = 0; i < remainingFiles.length; i += batchSize) {
    const batch = remainingFiles.slice(i, i + batchSize);
    console.log(`📤 上传第 ${Math.floor(i/batchSize) + 1} 批文件 (${batch.length} 个)...`);
    
    for (const file of batch) {
      const filePath = path.join(ASSETS_PATH, file);
      try {
        execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no "${filePath}" ${SERVER_USER}@${SERVER_IP}:/var/www/leaftalk/frontend/assets/`, {
          stdio: 'pipe'
        });
        remainingUploaded++;
      } catch (error) {
        // 静默跳过失败的文件
      }
    }
    
    // 每批之间稍作停顿
    if (i + batchSize < remainingFiles.length) {
      console.log('⏳ 等待2秒...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`✅ 剩余文件上传完成！成功上传 ${remainingUploaded} 个文件`);
  console.log(`🎉 总计上传 ${uploadedCount + remainingUploaded} 个assets文件`);

} catch (error) {
  console.error('❌ 上传失败:', error.message);
  process.exit(1);
}
