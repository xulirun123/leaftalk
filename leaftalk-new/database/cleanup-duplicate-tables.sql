-- 清理重复且未使用的表
-- 根据分析结果，删除以下重复且未使用的表
-- 注意：先处理外键约束

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除 friendships 表的重复版本（保留 leaftalk-new 中的 user_friends）
DROP TABLE IF EXISTS `leaftalk_enterprise`.`friendships`;
DROP TABLE IF EXISTS `yeyu_app`.`friendships`;
DROP TABLE IF EXISTS `yeyu_messages`.`friendships`;

-- 删除 media_files 表的重复版本
DROP TABLE IF EXISTS `leaftalk_enterprise`.`media_files`;
DROP TABLE IF EXISTS `yeyu_messages`.`media_files`;

-- 删除 messages 表的重复版本
DROP TABLE IF EXISTS `leaftalk_enterprise`.`messages`;
DROP TABLE IF EXISTS `yeyu_messages`.`messages`;

-- 删除 user_settings 表的重复版本
DROP TABLE IF EXISTS `leaftalk_enterprise`.`user_settings`;
DROP TABLE IF EXISTS `yeyu_app`.`user_settings`;

-- 删除 chat_members 表的重复版本
DROP TABLE IF EXISTS `yeyu_app`.`chat_members`;
DROP TABLE IF EXISTS `yeyu_messages`.`chat_members`;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 显示清理结果
SELECT '✅ 重复且未使用的表已清理完成' as result;
