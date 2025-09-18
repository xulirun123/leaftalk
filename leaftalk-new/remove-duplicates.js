const fs = require('fs');
const path = require('path');

// 要删除的重复文件列表
const filesToDelete = [
  // 删除design-system中的重复文件，保留shared版本
  'src/design-system/components/AvatarPreloader.vue',
  'src/design-system/components/ConfirmDialog.vue',
  'src/design-system/components/EmptyState.vue',
  'src/design-system/components/ErrorBoundary.vue',
  'src/design-system/components/FallbackIcon.vue',
  'src/design-system/components/OptimizedAvatar.vue',
  'src/design-system/components/PolicyModal.vue',
  'src/design-system/components/ToggleSwitch.vue',
  'src/design-system/components/UnifiedAvatar.vue',
  'src/design-system/components/UnifiedUserInfo.vue',
  
  // 删除design-system中的重复图标，保留shared版本
  'src/design-system/icons/ContactsIcon.vue',
  'src/design-system/icons/DiscoverIcon.vue',
  'src/design-system/icons/GenealogyIcon.vue',
  'src/design-system/icons/IconifyReplacement.vue',
  'src/design-system/icons/LocalIcon.vue',
  'src/design-system/icons/ModernIcon.vue',
  'src/design-system/icons/Phone.vue',
  'src/design-system/icons/SimpleIcon.vue',
  'src/design-system/icons/SingleLeafIcon.vue',
  'src/design-system/icons/WeChatIcon.vue',
  
  // 删除design-system中的linear图标重复
  'src/design-system/icons/linear/ArrowDownTray.vue',
  'src/design-system/icons/linear/ArrowPath.vue',
  'src/design-system/icons/linear/ArrowRightOnRectangle.vue',
  'src/design-system/icons/linear/Battery.vue',
  'src/design-system/icons/linear/Bell.vue',
  'src/design-system/icons/linear/Block.vue',
  'src/design-system/icons/linear/Camera.vue',
  'src/design-system/icons/linear/ChatBubbleLeft.vue',
  'src/design-system/icons/linear/Check.vue',
  'src/design-system/icons/linear/ChevronDown.vue',
  'src/design-system/icons/linear/ChevronLeft.vue',
  'src/design-system/icons/linear/ChevronRight.vue',
  'src/design-system/icons/linear/ChevronUp.vue',
  'src/design-system/icons/linear/Compass.vue',
  'src/design-system/icons/linear/CreditCard.vue',
  'src/design-system/icons/linear/Edit.vue',
  'src/design-system/icons/linear/EllipsisHorizontal.vue',
  'src/design-system/icons/linear/FaceSmile.vue',
  'src/design-system/icons/linear/FingerPrint.vue',
  'src/design-system/icons/linear/GitBranch.vue',
  'src/design-system/icons/linear/Heart.vue',
  'src/design-system/icons/linear/HeartSolid.vue',
  'src/design-system/icons/linear/Home.vue',
  'src/design-system/icons/linear/MagnifyingGlass.vue',
  'src/design-system/icons/linear/Microphone.vue',
  'src/design-system/icons/linear/MicrophoneSlash.vue',
  'src/design-system/icons/linear/PersonRemove.vue',
  'src/design-system/icons/linear/Plus.vue',
  'src/design-system/icons/linear/QrCode.vue',
  'src/design-system/icons/linear/QuestionMark.vue',
  'src/design-system/icons/linear/Settings.vue',
  'src/design-system/icons/linear/Signal.vue',
  'src/design-system/icons/linear/Trash.vue',
  'src/design-system/icons/linear/User.vue',
  'src/design-system/icons/linear/UserGroup.vue',
  'src/design-system/icons/linear/UserPlus.vue',
  'src/design-system/icons/linear/VideoCamera.vue',
  'src/design-system/icons/linear/VideoCameraSlash.vue',
  'src/design-system/icons/linear/Wifi.vue',
  'src/design-system/icons/linear/XMark.vue',
  
  // 删除design-system中的layout重复
  'src/design-system/layouts/BusinessCard.vue',
  'src/design-system/layouts/EmojiPicker.vue',
  'src/design-system/layouts/InputMethod.vue',
  'src/design-system/layouts/LiveLocationShare.vue',
  'src/design-system/layouts/MobileTabBar.vue',
  'src/design-system/layouts/MobileTopBar.vue',
  'src/design-system/layouts/StatusBar.vue',
  'src/design-system/layouts/VideoPreviewEditor.vue',
  'src/design-system/layouts/VoiceRecorder.vue',
  'src/design-system/layouts/WeChatCamera.vue'
];

// 执行删除
let deletedCount = 0;
let errorCount = 0;

filesToDelete.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ 已删除: ${filePath}`);
      deletedCount++;
    } else {
      console.log(`⚠️  文件不存在: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ 删除失败: ${filePath} - ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 删除统计:`);
console.log(`✅ 成功删除: ${deletedCount} 个文件`);
console.log(`❌ 删除失败: ${errorCount} 个文件`);
console.log(`🎉 第一批重复文件清理完成！`);
