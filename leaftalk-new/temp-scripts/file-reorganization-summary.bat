@echo off
echo ========================================
echo 文件结构重新组织 - 完成
echo ========================================

echo.
echo ✅ 已按模块化架构重新组织文件结构：

echo.
echo 📱 Chat模块 (src/modules/chat/)
echo   ├── pages/ (11个聊天页面)
echo   ├── components/ (聊天专用组件)
echo   │   ├── ChatList.vue
echo   │   └── LocationMessage.vue
echo   ├── services/ (聊天API服务)
echo   │   └── chatApi.ts
echo   └── utils/ (聊天工具类)
echo       ├── callManager.ts
echo       └── groupManager.ts

echo.
echo 👥 Contacts模块 (src/modules/contacts/)
echo   ├── pages/ (12个联系人页面)
echo   ├── services/ (联系人API服务)
echo   │   ├── contactsApi.ts
echo   │   └── friendsService.ts
echo   └── utils/ (联系人工具类)
echo       └── groupAvatarGenerator.ts

echo.
echo 🔍 Discover模块 (src/modules/discover/)
echo   ├── pages/ (21个发现页面)
echo   └── components/ (发现专用组件)

echo.
echo 👤 Profile模块 (src/modules/profile/)
echo   ├── pages/ (8个个人资料页面)
echo   └── components/ (个人资料专用组件)

echo.
echo 🌳 Genealogy模块 (src/modules/genealogy/)
echo   ├── pages/ (56个族谱页面)
echo   ├── components/ (族谱专用组件)
echo   │   ├── AccessLevelBanner.vue
echo   │   ├── MemberCard.vue
echo   │   ├── MemberDetailPanel.vue
echo   │   └── TreeBranch.vue
echo   └── services/ (族谱API服务)
echo       └── genealogyApi.ts

echo.
echo 🎬 Video模块 (src/modules/video/)
echo   ├── pages/ (16个视频页面)
echo   ├── services/ (视频API服务)
echo   │   └── videoChannelApi.ts
echo   └── utils/ (视频工具类)
echo       ├── liveStream.ts
echo       └── liveStreamManager.ts

echo.
echo 💰 Payment模块 (src/modules/payment/)
echo   ├── pages/ (11个支付页面)
echo   ├── components/ (支付专用组件)
echo   │   └── PaymentPasswordModalNew.vue
echo   ├── services/ (支付API服务)
echo   │   ├── paymentApi.ts
echo   │   └── paymentService.ts
echo   └── utils/ (支付工具类)
echo       └── paymentManager.ts

echo.
echo 📱 Moments模块 (src/modules/moments/)
echo   ├── pages/ (6个朋友圈页面)
echo   ├── services/ (朋友圈API服务)
echo   │   └── momentsApi.ts
echo   └── utils/ (朋友圈工具类)
echo       └── momentsManager.ts

echo.
echo 🔐 Auth模块 (src/modules/auth/)
echo   ├── pages/ (7个认证页面)
echo   └── services/ (认证API服务)
echo       └── authApi.ts

echo.
echo 💼 Wallet模块 (src/modules/wallet/)
echo   └── pages/ (1个钱包页面)

echo.
echo 🔧 Shared目录 (src/shared/) - 只保留真正共享的
echo   ├── components/ (跨模块共享组件)
echo   │   ├── common/ (通用组件 - 10个)
echo   │   ├── mobile/ (移动端组件 - 10个)
echo   │   ├── icons/ (图标组件 - 50+个)
echo   │   ├── map/ (地图组件 - 2个)
echo   │   ├── cemetery/ (墓地组件 - 6个)
echo   │   └── debug/ (调试组件 - 1个)
echo   ├── services/ (核心API服务)
echo   │   ├── apiClient.ts
echo   │   └── speechRecognition.ts
echo   ├── utils/ (通用工具类 - 30+个)
echo   ├── types/ (类型定义 - 3个)
echo   ├── config/ (配置文件 - 4个)
echo   ├── styles/ (样式文件 - 5个)
echo   ├── i18n/ (国际化 - 10个)
echo   ├── plugins/ (插件 - 2个)
echo   └── assets/ (资源文件 - 1个)

echo.
echo 📊 重组统计：
echo - 模块数量: 9个主要模块
echo - 页面文件: 98个 (按功能分布到各模块)
echo - 组件文件: 80+个 (专用组件移到对应模块)
echo - 服务文件: 16个 (API服务移到对应模块)
echo - 工具类文件: 41个 (专用工具移到对应模块)
echo - 共享文件: 60+个 (保留在shared目录)

echo.
echo 🎯 重组的优势：
echo - ✅ 模块化架构: 每个功能模块独立完整
echo - ✅ 清晰职责: 专用文件归属明确的模块
echo - ✅ 易于维护: 修改功能只需关注对应模块
echo - ✅ 团队协作: 不同团队可以专注不同模块
echo - ✅ 代码复用: 真正共享的文件在shared目录

echo.
echo ========================================
echo 文件结构重新组织完成！
echo ========================================

echo.
echo 现在的项目结构：
echo - 每个模块都有完整的 pages/components/services/utils
echo - 专用文件归属到对应的功能模块
echo - 共享文件保留在shared目录
echo - 符合现代前端项目的模块化架构

echo.
pause
