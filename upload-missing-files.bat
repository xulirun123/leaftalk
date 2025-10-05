@echo off
echo 🚀 开始上传缺失的JavaScript文件...

set SERVER=root@120.24.148.204
set REMOTE_PATH=/var/www/leaftalk/frontend/assets/
set LOCAL_PATH=leaftalk-new/dist/assets/

echo 📤 上传 contactsApi-CwPTTazW.js...
scp %LOCAL_PATH%contactsApi-CwPTTazW.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 ChatHomeEnterprise-pISaS_7B.js...
scp %LOCAL_PATH%ChatHomeEnterprise-pISaS_7B.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 nicknameGenerator-BwYEWQQm.js...
scp %LOCAL_PATH%nicknameGenerator-BwYEWQQm.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 Login-BpvNphd9.js...
scp %LOCAL_PATH%Login-BpvNphd9.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 MobileDiscover-jkHYisd7.js...
scp %LOCAL_PATH%MobileDiscover-jkHYisd7.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 index-Dql8rQ5C.js...
scp %LOCAL_PATH%index-Dql8rQ5C.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 userInfo-BWFckzm1.js...
scp %LOCAL_PATH%userInfo-BWFckzm1.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 MobileProfile-C0YawWv6.js...
scp %LOCAL_PATH%MobileProfile-C0YawWv6.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 MobileContacts-BGJQSG2B.js...
scp %LOCAL_PATH%MobileContacts-BGJQSG2B.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 ui-vendor-l0sNRNKZ.js...
scp %LOCAL_PATH%ui-vendor-l0sNRNKZ.js %SERVER%:%REMOTE_PATH%

echo 📤 上传 index-D-bMfwyM.js...
scp %LOCAL_PATH%index-D-bMfwyM.js %SERVER%:%REMOTE_PATH%

echo ✅ 所有缺失文件上传完成！
pause
