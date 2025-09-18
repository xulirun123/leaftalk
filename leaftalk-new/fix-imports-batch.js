const fs = require('fs');
const path = require('path');

// 批量修复导入路径的函数
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 修复stores导入路径
    const storeReplacements = [
      { from: /from ['"]\.\.\/stores\/auth['"]/g, to: "from '../../../stores/auth'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/auth['"]/g, to: "from '../../../stores/auth'" },
      { from: /from ['"]\.\.\/stores\/app['"]/g, to: "from '../../../shared/stores/appStore'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/app['"]/g, to: "from '../../../shared/stores/appStore'" },
      { from: /from ['"]\.\.\/stores\/chat['"]/g, to: "from '../../../stores/chat'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/chat['"]/g, to: "from '../../../stores/chat'" },
      { from: /from ['"]\.\.\/stores\/contact['"]/g, to: "from '../../../stores/contact'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/contact['"]/g, to: "from '../../../stores/contact'" },
      { from: /from ['"]\.\.\/stores\/moments['"]/g, to: "from '../../../stores/moments'" },
      { from: /from ['"]\.\.\/\.\.\/stores\/moments['"]/g, to: "from '../../../stores/moments'" }
    ];

    // 修复组件导入路径
    const componentReplacements = [
      { from: /from ['"]\.\.\/\.\.\/components\/mobile\/MobileTopBar\.vue['"]/g, to: "from '../../../shared/components/mobile/MobileTopBar.vue'" },
      { from: /from ['"]\.\.\/\.\.\/components\/mobile\/MobileTabBar\.vue['"]/g, to: "from '../../../shared/components/mobile/MobileTabBar.vue'" },
      { from: /from ['"]\.\.\/\.\.\/components\/common\/OptimizedAvatar\.vue['"]/g, to: "from '../../../shared/components/common/OptimizedAvatar.vue'" },
      { from: /from ['"]\.\.\/\.\.\/components\/common\/UnifiedUserInfo\.vue['"]/g, to: "from '../../../shared/components/common/UnifiedUserInfo.vue'" }
    ];

    // 修复utils导入路径
    const utilsReplacements = [
      { from: /from ['"]\.\.\/\.\.\/utils\/safeNavigation['"]/g, to: "from '../../../shared/utils/safeNavigation'" },
      { from: /from ['"]\.\.\/\.\.\/utils\/userInfo['"]/g, to: "from '../../../shared/utils/userInfo'" }
    ];

    // 执行所有替换
    [...storeReplacements, ...componentReplacements, ...utilsReplacements].forEach(rule => {
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

// 递归查找所有Vue文件
function findVueFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findVueFiles(fullPath));
    } else if (item.endsWith('.vue')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 执行批量修复
console.log('🔧 开始批量修复导入路径...');

const modulesDir = './src/modules';
const vueFiles = findVueFiles(modulesDir);

let fixedCount = 0;
vueFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 修复统计:`);
console.log(`✅ 修复文件数: ${fixedCount}`);
console.log(`📁 总文件数: ${vueFiles.length}`);
console.log(`🎉 批量导入路径修复完成！`);
