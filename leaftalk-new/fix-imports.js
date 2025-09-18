const fs = require('fs');
const path = require('path');

// 读取router文件
const routerPath = './src/router/index.ts';
let content = fs.readFileSync(routerPath, 'utf8');

// 定义替换规则 - 第三批
const replacements = [
  // 剩余的mobile页面
  { from: '../views/mobile/LocationPicker.vue', to: '../modules/discover/pages/LocationPicker.vue' },
  { from: '../views/mobile/MyQRCodeSimple.vue', to: '../modules/user/pages/MyQRCodeSimple.vue' },
  { from: '../views/mobile/StartGroupChat.vue', to: '../modules/chat/pages/StartGroupChat.vue' },
  { from: '../views/mobile/CreateGroup.vue', to: '../modules/chat/pages/CreateGroup.vue' },
  { from: '../views/mobile/ScanQR.vue', to: '../modules/discover/pages/ScanQR.vue' },
  { from: '../views/mobile/GroupInfo.vue', to: '../modules/chat/pages/GroupInfo.vue' },
  { from: '../views/mobile/MyGroups.vue', to: '../modules/chat/pages/MyGroups.vue' },
  { from: '../views/mobile/LocationShare.vue', to: '../modules/chat/pages/LocationShare.vue' },
  { from: '../views/mobile/SecurityDashboard.vue', to: '../modules/admin/pages/SecurityDashboard.vue' },
  { from: '../views/mobile/SecurityEvents.vue', to: '../modules/admin/pages/SecurityEvents.vue' },
  { from: '../views/mobile/SecurityPolicies.vue', to: '../modules/admin/pages/SecurityPolicies.vue' },
  { from: '../views/mobile/SecurityDevices.vue', to: '../modules/admin/pages/SecurityDevices.vue' },

  // Test相关
  { from: '../views/test/ApiTest.vue', to: '../shared/pages/test/ApiTest.vue' },
  { from: '../views/test/UserInfoTest.vue', to: '../shared/pages/test/UserInfoTest.vue' },
  { from: '../views/test/StoreTest.vue', to: '../shared/pages/test/StoreTest.vue' },
  { from: '../views/IconTest.vue', to: '../shared/pages/test/IconTest.vue' },

  // RedPacket相关
  { from: '../views/redpacket/SendRedPacketNew.vue', to: '../modules/payment/pages/SendRedPacketNew.vue' },
  { from: '../views/redpacket/LuckyRedPacketDetail.vue', to: '../modules/payment/pages/LuckyRedPacketDetail.vue' },

  // Location相关
  { from: '../views/location/LocationShare.vue', to: '../modules/chat/pages/LocationShare.vue' },

  // Group相关
  { from: '../views/group/GroupChat.vue', to: '../modules/chat/pages/GroupChat.vue' },

  // Analytics相关
  { from: '../views/analytics/Dashboard.vue', to: '../modules/admin/pages/Dashboard.vue' }
];

// 执行替换
replacements.forEach(rule => {
  content = content.replace(new RegExp(rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), rule.to);
});

// 写回文件
fs.writeFileSync(routerPath, content);
console.log('✅ 批量替换完成！');
