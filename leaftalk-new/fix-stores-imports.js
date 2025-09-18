const fs = require('fs');
const path = require('path');

// 批量修复stores导入路径的函数
function fixStoresImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 修复stores导入路径
    const storeReplacements = [
      // auth store 导入修复 - 统一指向全局authStore
      { from: /from ['"]\.\.\/\.\.\/\.\.\/stores\/auth['"]/g, to: "from '../stores/authStore'" },
      { from: /from ['"]\.\.\/stores\/authStore['"]/g, to: "from '../../../stores/auth'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/auth['"]/g, to: "from '../../../stores/auth'" },
      { from: /from ['"]\.\.\/stores\/auth['"]/g, to: "from '../../../stores/auth'" },

      // chat store 导入修复
      { from: /from ['"]\.\.\/\.\.\/\.\.\/stores\/chat['"]/g, to: "from '../chat/stores/chatStore'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/chat['"]/g, to: "from '../chat/stores/chatStore'" },
      { from: /from ['"]\.\.\/chat\/stores\/chatStore['"]/g, to: "from '../chat/stores/chatStore'" },

      // contact store 导入修复
      { from: /from ['"]\.\.\/\.\.\/\.\.\/stores\/contact['"]/g, to: "from '../contacts/stores/contactStore'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/contact['"]/g, to: "from '../contacts/stores/contactStore'" },
      { from: /from ['"]\.\.\/contacts\/stores\/contactStore['"]/g, to: "from './stores/contactStore'" },

      // identity store 导入修复
      { from: /from ['"]\.\.\/\.\.\/\.\.\/stores\/identity['"]/g, to: "from './stores/identityStore'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/identity['"]/g, to: "from './stores/identityStore'" },

      // discover store 导入修复
      { from: /from ['"]\.\.\/\.\.\/stores\/discover['"]/g, to: "from './stores/discover'" },
      { from: /from ['"]\.\.\/stores\/discover['"]/g, to: "from './stores/discover'" },

      // shared utils 导入修复
      { from: /from ['"]\.\.\/stores\/authStore['"]/g, to: "from '../../stores/auth'" }
    ];

    // 执行所有替换
    storeReplacements.forEach(rule => {
      const newContent = content.replace(rule.from, rule.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ 修复: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ 修复失败: ${filePath} - ${error.message}`);
    return false;
  }
}

// 递归查找所有Vue和TS文件
function findFiles(dir, extensions = ['.vue', '.ts']) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 执行批量修复
console.log('🔧 开始批量修复stores导入路径...');

const srcDir = './src';
const files = findFiles(srcDir);

let fixedCount = 0;
files.forEach(file => {
  if (fixStoresImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 修复统计:`);
console.log(`✅ 修复文件数: ${fixedCount}`);
console.log(`📁 总文件数: ${files.length}`);
console.log(`🎉 批量stores导入路径修复完成！`);
