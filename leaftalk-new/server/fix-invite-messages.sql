-- 修复所有旧的邀请消息类型
-- 将 type='text' 但内容包含 group_invite 的消息更新为 type='group_invite'

UPDATE messages 
SET `type` = 'group_invite' 
WHERE `type` = 'text' 
AND content LIKE '%group_invite%';

-- 查看修复结果
SELECT COUNT(*) as fixed_count FROM messages WHERE `type` = 'group_invite';

