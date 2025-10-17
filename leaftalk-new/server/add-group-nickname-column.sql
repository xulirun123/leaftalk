-- 添加群内昵称字段到group_members表
-- 执行时间: 2025-10-12

USE `leaftalk-new`;

-- 检查并添加nickname字段
ALTER TABLE `group_members` 
ADD COLUMN IF NOT EXISTS `nickname` VARCHAR(100) DEFAULT NULL COMMENT '群内昵称' 
AFTER `role`;

-- 验证字段是否添加成功
DESCRIBE `group_members`;

