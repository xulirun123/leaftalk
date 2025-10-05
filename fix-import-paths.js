const fs = require('fs');
const path = require('path');

// 需要修复的路径映射
const pathMappings = [
  {
    from: "import { useAppStore } from '../../../stores/app'",
    to: "import { useAppStore } from '../../../shared/stores/appStore'"
  },
  {
    from: "import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'",
    to: "import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'"
  },
  {
    from: "import { useBlacklistStore, type BlacklistUser } from '../../stores/blacklist'",
    to: "import { useBlacklistStore, type BlacklistUser } from '../../../stores/blacklist'"
  },
  {
    from: "import { contactAPI } from '../../../modules/contacts/services/api'",
    to: "import { contactAPI } from '../../contacts/services/contactsApi'"
  },
  {
    from: "import { contactAPI } from '../../contacts/services/api'",
    to: "import { contactAPI } from '../../contacts/services/contactsApi'"
  },
  {
    from: "from '../../stores/ai'",
    to: "from '../../../stores/ai'"
  },
  {
    from: "from '../../../stores/app'",
    to: "from '../../../shared/stores/appStore'"
  },
  {
    from: "from '../../composables/useI18n'",
    to: "from '../../../shared/composables/useI18n'"
  }
];

// 递归搜索所有Vue和TS文件
function findFiles(dir, extensions = ['.vue', '.ts']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // 跳过node_modules等目录
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// 修复文件中的导入路径
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    pathMappings.forEach(mapping => {
      if (content.includes(mapping.from)) {
        content = content.replace(new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), mapping.to);
        modified = true;
        console.log(`✅ 修复 ${filePath}: ${mapping.from} -> ${mapping.to}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
  }
  
  return false;
}

// 主函数
function main() {
  console.log('🔧 开始批量修复导入路径...');
  
  const srcDir = path.join(__dirname, 'leaftalk-new', 'src');
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src目录不存在:', srcDir);
    return;
  }
  
  const files = findFiles(srcDir);
  console.log(`📁 找到 ${files.length} 个文件`);
  
  let fixedCount = 0;
  files.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`🎉 修复完成！共修复 ${fixedCount} 个文件`);
}

main();
