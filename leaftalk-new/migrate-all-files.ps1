# 完整迁移所有文件到新结构

Write-Host "开始完整文件迁移..." -ForegroundColor Green

$oldPath = "F:\leaftalk\leaftalk-enterprise"
$newPath = "F:\leaftalk\leaftalk-new"

# 1. 迁移API服务文件
Write-Host "迁移API服务文件..." -ForegroundColor Cyan

Copy-Item "$oldPath\src\services\api\auth.ts" "$newPath\src\modules\auth\services\authService.ts" -Force
Copy-Item "$oldPath\src\services\api\chat.ts" "$newPath\src\modules\chat\services\chatService.ts" -Force
Copy-Item "$oldPath\src\services\api\call.ts" "$newPath\src\modules\chat\services\callService.ts" -Force
Copy-Item "$oldPath\src\services\api\contacts.ts" "$newPath\src\modules\contacts\services\contactsService.ts" -Force
Copy-Item "$oldPath\src\services\api\moments.ts" "$newPath\src\modules\moments\services\momentsService.ts" -Force
Copy-Item "$oldPath\src\services\api\payment.ts" "$newPath\src\modules\payment\services\paymentService.ts" -Force
Copy-Item "$oldPath\src\services\api\genealogy.ts" "$newPath\src\modules\genealogy\services\genealogyService.ts" -Force
Copy-Item "$oldPath\src\services\api\user.ts" "$newPath\src\modules\user\services\userService.ts" -Force
Copy-Item "$oldPath\src\services\api\file.ts" "$newPath\src\shared\services\fileService.ts" -Force
Copy-Item "$oldPath\src\services\api\types.ts" "$newPath\src\shared\types\apiTypes.ts" -Force

Write-Host "API服务文件迁移完成" -ForegroundColor Green

# 2. 迁移状态管理文件
Write-Host "迁移状态管理文件..." -ForegroundColor Cyan

# 认证模块
Copy-Item "$oldPath\src\stores\auth.ts" "$newPath\src\modules\auth\stores\authStore.ts" -Force
Copy-Item "$oldPath\src\stores\identity.ts" "$newPath\src\modules\auth\stores\identityStore.ts" -Force
Copy-Item "$oldPath\src\stores\security.ts" "$newPath\src\modules\auth\stores\securityStore.ts" -Force

# 聊天模块
Copy-Item "$oldPath\src\stores\chat.ts" "$newPath\src\modules\chat\stores\chatStore.ts" -Force
Copy-Item "$oldPath\src\stores\call.ts" "$newPath\src\modules\chat\stores\callStore.ts" -Force

# 通讯录模块
Copy-Item "$oldPath\src\stores\contact.ts" "$newPath\src\modules\contacts\stores\contactsStore.ts" -Force
Copy-Item "$oldPath\src\stores\blacklist.ts" "$newPath\src\modules\contacts\stores\blacklistStore.ts" -Force

# 其他模块
Copy-Item "$oldPath\src\stores\moments.ts" "$newPath\src\modules\moments\stores\momentsStore.ts" -Force
Copy-Item "$oldPath\src\stores\payment.ts" "$newPath\src\modules\payment\stores\paymentStore.ts" -Force
Copy-Item "$oldPath\src\stores\wallet.ts" "$newPath\src\modules\wallet\stores\walletStore.ts" -Force
Copy-Item "$oldPath\src\stores\discover.ts" "$newPath\src\modules\discover\stores\discoverStore.ts" -Force
Copy-Item "$oldPath\src\stores\video.ts" "$newPath\src\modules\video\stores\videoStore.ts" -Force
Copy-Item "$oldPath\src\stores\user.ts" "$newPath\src\modules\user\stores\userStore.ts" -Force
Copy-Item "$oldPath\src\stores\admin.ts" "$newPath\src\modules\admin\stores\adminStore.ts" -Force

# 设置模块
Copy-Item "$oldPath\src\stores\general.ts" "$newPath\src\modules\settings\stores\settingsStore.ts" -Force
Copy-Item "$oldPath\src\stores\privacy.ts" "$newPath\src\modules\settings\stores\privacyStore.ts" -Force

# 共享stores
Copy-Item "$oldPath\src\stores\app.ts" "$newPath\src\shared\stores\appStore.ts" -Force
Copy-Item "$oldPath\src\stores\notification.ts" "$newPath\src\shared\stores\notificationStore.ts" -Force
Copy-Item "$oldPath\src\stores\favorites.ts" "$newPath\src\shared\stores\favoritesStore.ts" -Force
Copy-Item "$oldPath\src\stores\unread.ts" "$newPath\src\shared\stores\unreadStore.ts" -Force

Write-Host "状态管理文件迁移完成" -ForegroundColor Green

# 3. 迁移页面文件
Write-Host "迁移页面文件..." -ForegroundColor Cyan

# 认证页面
Copy-Item "$oldPath\src\views\mobile\IdentityVerification.vue" "$newPath\src\modules\auth\pages\VerifyIdentity.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\IdentityManagement.vue" "$newPath\src\modules\auth\pages\ManageIdentity.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\SecurityDashboard.vue" "$newPath\src\modules\auth\pages\SecurityDashboard.vue" -Force -ErrorAction SilentlyContinue

# 聊天页面
Copy-Item "$oldPath\src\views\mobile\MobileHomeSimple.vue" "$newPath\src\modules\chat\pages\ChatHome.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\chat\ChatSimple.vue" "$newPath\src\modules\chat\pages\ChatRoom.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\ChatInfo.vue" "$newPath\src\modules\chat\pages\ChatInfo.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\CreateGroup.vue" "$newPath\src\modules\chat\pages\CreateGroup.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\VoiceCall.vue" "$newPath\src\modules\chat\pages\VoiceCall.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\VideoCall.vue" "$newPath\src\modules\chat\pages\VideoCall.vue" -Force -ErrorAction SilentlyContinue

# 通讯录页面
Copy-Item "$oldPath\src\views\mobile\MobileContacts.vue" "$newPath\src\modules\contacts\pages\ContactsHome.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\AddFriendNew.vue" "$newPath\src\modules\contacts\pages\AddFriend.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\NewFriends.vue" "$newPath\src\modules\contacts\pages\FriendRequests.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\FriendProfileSimple.vue" "$newPath\src\modules\contacts\pages\FriendProfile.vue" -Force -ErrorAction SilentlyContinue

# 朋友圈页面
Copy-Item "$oldPath\src\views\mobile\MobileMomentsNew.vue" "$newPath\src\modules\moments\pages\MomentsHome.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\PublishMoment.vue" "$newPath\src\modules\moments\pages\PublishMoment.vue" -Force -ErrorAction SilentlyContinue

# 支付页面
Copy-Item "$oldPath\src\views\mobile\Payment.vue" "$newPath\src\modules\payment\pages\PaymentHome.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\RedPacket.vue" "$newPath\src\modules\payment\pages\SendRedPacket.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\Transfer.vue" "$newPath\src\modules\payment\pages\TransferMoney.vue" -Force -ErrorAction SilentlyContinue

# 钱包页面
Copy-Item "$oldPath\src\views\mobile\Wallet.vue" "$newPath\src\modules\wallet\pages\WalletHome.vue" -Force -ErrorAction SilentlyContinue

# 设置页面
Copy-Item "$oldPath\src\views\mobile\Settings.vue" "$newPath\src\modules\settings\pages\SettingsHome.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\views\mobile\MobileProfile.vue" "$newPath\src\modules\settings\pages\ProfileEdit.vue" -Force -ErrorAction SilentlyContinue

# 发现页面
Copy-Item "$oldPath\src\views\mobile\MobileDiscover.vue" "$newPath\src\modules\discover\pages\DiscoverHome.vue" -Force -ErrorAction SilentlyContinue

# 家谱页面
Copy-Item "$oldPath\src\views\mobile\Genealogy.vue" "$newPath\src\modules\genealogy\pages\GenealogyHome.vue" -Force -ErrorAction SilentlyContinue

Write-Host "页面文件迁移完成" -ForegroundColor Green

# 4. 迁移组件文件
Write-Host "迁移组件文件..." -ForegroundColor Cyan

# 聊天组件
if (Test-Path "$oldPath\src\components\chat") {
    Copy-Item "$oldPath\src\components\chat\*" "$newPath\src\modules\chat\components\" -Recurse -Force
}

# 家谱组件
if (Test-Path "$oldPath\src\components\genealogy") {
    Copy-Item "$oldPath\src\components\genealogy\*" "$newPath\src\modules\genealogy\components\" -Recurse -Force
}

# 支付组件
if (Test-Path "$oldPath\src\components\payment") {
    Copy-Item "$oldPath\src\components\payment\*" "$newPath\src\modules\payment\components\" -Recurse -Force
}

# 通用组件迁移到设计系统
Copy-Item "$oldPath\src\components\common\OptimizedAvatar.vue" "$newPath\src\design-system\components\YeAvatar.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\components\mobile\MobileTopBar.vue" "$newPath\src\design-system\layouts\MobileHeader.vue" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\components\mobile\MobileTabBar.vue" "$newPath\src\design-system\layouts\MobileTabBar.vue" -Force -ErrorAction SilentlyContinue

# 图标组件
if (Test-Path "$oldPath\src\components\icons") {
    Copy-Item "$oldPath\src\components\icons\*" "$newPath\src\design-system\icons\" -Recurse -Force
}

Write-Host "组件文件迁移完成" -ForegroundColor Green

# 5. 迁移工具函数
Write-Host "迁移工具函数..." -ForegroundColor Cyan

# 共享工具
Copy-Item "$oldPath\src\utils\avatar.ts" "$newPath\src\shared\utils\avatarUtils.ts" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\utils\dialog.ts" "$newPath\src\shared\utils\dialogUtils.ts" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\utils\toast.ts" "$newPath\src\shared\utils\toastUtils.ts" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\utils\performance.ts" "$newPath\src\shared\utils\performanceUtils.ts" -Force -ErrorAction SilentlyContinue

# 模块专用工具
Copy-Item "$oldPath\src\utils\paymentManager.ts" "$newPath\src\modules\payment\utils\paymentUtils.ts" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\utils\callManager.ts" "$newPath\src\modules\chat\utils\callUtils.ts" -Force -ErrorAction SilentlyContinue

Write-Host "工具函数迁移完成" -ForegroundColor Green

# 6. 迁移服务文件
Write-Host "迁移服务文件..." -ForegroundColor Cyan

Copy-Item "$oldPath\src\services\apiClient.ts" "$newPath\src\shared\core\apiClient.ts" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\src\services\dataSync.ts" "$newPath\src\shared\services\dataSyncService.ts" -Force -ErrorAction SilentlyContinue

Write-Host "服务文件迁移完成" -ForegroundColor Green

# 7. 迁移配置文件
Write-Host "迁移配置文件..." -ForegroundColor Cyan

Copy-Item "$oldPath\package.json" "$newPath\package.json" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\vite.config.ts" "$newPath\vite.config.ts" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\tsconfig.json" "$newPath\tsconfig.json" -Force -ErrorAction SilentlyContinue
Copy-Item "$oldPath\.env*" "$newPath\" -Force -ErrorAction SilentlyContinue

Write-Host "配置文件迁移完成" -ForegroundColor Green

# 8. 迁移样式文件
Write-Host "迁移样式文件..." -ForegroundColor Cyan

if (Test-Path "$oldPath\src\styles") {
    Copy-Item "$oldPath\src\styles\*" "$newPath\src\styles\" -Recurse -Force
}

Write-Host "样式文件迁移完成" -ForegroundColor Green

# 9. 迁移资源文件
Write-Host "迁移资源文件..." -ForegroundColor Cyan

if (Test-Path "$oldPath\src\assets") {
    Copy-Item "$oldPath\src\assets\*" "$newPath\src\assets\" -Recurse -Force
}

if (Test-Path "$oldPath\public") {
    Copy-Item "$oldPath\public\*" "$newPath\public\" -Recurse -Force
}

Write-Host "资源文件迁移完成" -ForegroundColor Green

Write-Host "所有文件迁移完成！" -ForegroundColor Green
Write-Host "新项目位置: $newPath" -ForegroundColor Yellow
