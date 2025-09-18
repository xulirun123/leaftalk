-- 用户通用设置表
CREATE TABLE IF NOT EXISTS user_general_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- 语言和显示设置
  language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '界面语言',
  font_size ENUM('small', 'standard', 'large', 'extra_large') DEFAULT 'standard' COMMENT '字体大小',
  theme_mode ENUM('light', 'dark', 'auto') DEFAULT 'auto' COMMENT '主题模式',
  
  -- 聊天设置
  enter_to_send BOOLEAN DEFAULT FALSE COMMENT '回车键发送消息',
  translate_enabled BOOLEAN DEFAULT TRUE COMMENT '启用翻译功能',
  chat_background VARCHAR(50) DEFAULT 'green' COMMENT '聊天背景',
  
  -- 下载设置
  auto_download_images BOOLEAN DEFAULT TRUE COMMENT '自动下载图片',
  auto_download_videos BOOLEAN DEFAULT FALSE COMMENT '自动下载视频',
  auto_download_files BOOLEAN DEFAULT FALSE COMMENT '自动下载文件',
  compress_images BOOLEAN DEFAULT TRUE COMMENT '压缩图片',
  
  -- 音频设置
  earphone_mode BOOLEAN DEFAULT FALSE COMMENT '听筒模式',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_general (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_language (language),
  INDEX idx_theme_mode (theme_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通用设置表';

-- 插入默认通用设置（为现有用户）
INSERT IGNORE INTO user_general_settings (
  user_id, language, font_size, theme_mode, enter_to_send, translate_enabled,
  chat_background, auto_download_images, auto_download_videos, auto_download_files,
  compress_images, earphone_mode
)
SELECT 
  id as user_id,
  'zh-CN' as language,
  'standard' as font_size,
  'auto' as theme_mode,
  FALSE as enter_to_send,
  TRUE as translate_enabled,
  'green' as chat_background,
  TRUE as auto_download_images,
  FALSE as auto_download_videos,
  FALSE as auto_download_files,
  TRUE as compress_images,
  FALSE as earphone_mode
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_general_settings);

-- 用户通知设置表
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- 消息通知
  message_notifications BOOLEAN DEFAULT TRUE COMMENT '消息通知',
  sound_enabled BOOLEAN DEFAULT TRUE COMMENT '声音提醒',
  vibration_enabled BOOLEAN DEFAULT TRUE COMMENT '震动提醒',
  notification_sound_id VARCHAR(50) DEFAULT 'default_notification' COMMENT '提示音ID',
  
  -- 通话设置
  call_notifications BOOLEAN DEFAULT TRUE COMMENT '通话通知',
  call_sound_id VARCHAR(50) DEFAULT 'default_ring' COMMENT '来电铃声ID',
  
  -- 朋友圈通知
  moments_notifications BOOLEAN DEFAULT TRUE COMMENT '朋友圈通知',
  moments_like_notifications BOOLEAN DEFAULT TRUE COMMENT '朋友圈点赞通知',
  moments_comment_notifications BOOLEAN DEFAULT TRUE COMMENT '朋友圈评论通知',
  
  -- 系统通知
  system_notifications BOOLEAN DEFAULT TRUE COMMENT '系统通知',
  security_notifications BOOLEAN DEFAULT TRUE COMMENT '安全通知',
  update_notifications BOOLEAN DEFAULT TRUE COMMENT '更新通知',
  
  -- 免打扰设置
  do_not_disturb_enabled BOOLEAN DEFAULT FALSE COMMENT '免打扰模式',
  do_not_disturb_start_time TIME DEFAULT '22:00:00' COMMENT '免打扰开始时间',
  do_not_disturb_end_time TIME DEFAULT '08:00:00' COMMENT '免打扰结束时间',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_notification (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_message_notifications (message_notifications),
  INDEX idx_do_not_disturb (do_not_disturb_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通知设置表';

-- 插入默认通知设置（为现有用户）
INSERT IGNORE INTO user_notification_settings (
  user_id, message_notifications, sound_enabled, vibration_enabled, notification_sound_id,
  call_notifications, call_sound_id, moments_notifications, moments_like_notifications,
  moments_comment_notifications, system_notifications, security_notifications, update_notifications,
  do_not_disturb_enabled, do_not_disturb_start_time, do_not_disturb_end_time
)
SELECT 
  id as user_id,
  TRUE as message_notifications,
  TRUE as sound_enabled,
  TRUE as vibration_enabled,
  'default_notification' as notification_sound_id,
  TRUE as call_notifications,
  'default_ring' as call_sound_id,
  TRUE as moments_notifications,
  TRUE as moments_like_notifications,
  TRUE as moments_comment_notifications,
  TRUE as system_notifications,
  TRUE as security_notifications,
  TRUE as update_notifications,
  FALSE as do_not_disturb_enabled,
  '22:00:00' as do_not_disturb_start_time,
  '08:00:00' as do_not_disturb_end_time
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_notification_settings);

-- 用户存储设置表
CREATE TABLE IF NOT EXISTS user_storage_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- 存储配额
  storage_quota BIGINT DEFAULT 10737418240 COMMENT '存储配额(字节，默认10GB)',
  storage_used BIGINT DEFAULT 0 COMMENT '已使用存储(字节)',
  
  -- 自动清理设置
  auto_cleanup_enabled BOOLEAN DEFAULT TRUE COMMENT '启用自动清理',
  cleanup_days INT DEFAULT 30 COMMENT '清理天数',
  
  -- 分类存储使用量
  images_used BIGINT DEFAULT 0 COMMENT '图片使用量',
  videos_used BIGINT DEFAULT 0 COMMENT '视频使用量',
  files_used BIGINT DEFAULT 0 COMMENT '文件使用量',
  cache_used BIGINT DEFAULT 0 COMMENT '缓存使用量',
  
  -- 清理设置
  auto_delete_temp_files BOOLEAN DEFAULT TRUE COMMENT '自动删除临时文件',
  auto_delete_cache BOOLEAN DEFAULT TRUE COMMENT '自动删除缓存',
  keep_original_images BOOLEAN DEFAULT FALSE COMMENT '保留原图',
  
  last_cleanup_at TIMESTAMP NULL COMMENT '上次清理时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_storage (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_storage_quota (storage_quota),
  INDEX idx_auto_cleanup (auto_cleanup_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户存储设置表';

-- 插入默认存储设置（为现有用户）
INSERT IGNORE INTO user_storage_settings (
  user_id, storage_quota, storage_used, auto_cleanup_enabled, cleanup_days,
  images_used, videos_used, files_used, cache_used,
  auto_delete_temp_files, auto_delete_cache, keep_original_images
)
SELECT 
  id as user_id,
  10737418240 as storage_quota, -- 10GB
  0 as storage_used,
  TRUE as auto_cleanup_enabled,
  30 as cleanup_days,
  0 as images_used,
  0 as videos_used,
  0 as files_used,
  0 as cache_used,
  TRUE as auto_delete_temp_files,
  TRUE as auto_delete_cache,
  FALSE as keep_original_images
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_storage_settings);

-- 创建视图：用户设置摘要
CREATE OR REPLACE VIEW user_settings_summary AS
SELECT 
  u.id as user_id,
  u.nickname,
  u.phone,
  
  -- 通用设置
  ugs.language,
  ugs.font_size,
  ugs.theme_mode,
  ugs.chat_background,
  
  -- 通知设置
  uns.message_notifications,
  uns.sound_enabled,
  uns.notification_sound_id,
  uns.do_not_disturb_enabled,
  
  -- 存储设置
  uss.storage_quota,
  uss.storage_used,
  ROUND((uss.storage_used / uss.storage_quota) * 100, 2) as storage_usage_percent,
  
  -- 隐私设置
  ups.phone_searchable,
  ups.need_verification,
  ups.moments_visible_range,
  
  -- 更新时间
  GREATEST(
    COALESCE(ugs.updated_at, '1970-01-01'),
    COALESCE(uns.updated_at, '1970-01-01'),
    COALESCE(uss.updated_at, '1970-01-01'),
    COALESCE(ups.updated_at, '1970-01-01')
  ) as last_settings_update
  
FROM users u
LEFT JOIN user_general_settings ugs ON u.id = ugs.user_id
LEFT JOIN user_notification_settings uns ON u.id = uns.user_id
LEFT JOIN user_storage_settings uss ON u.id = uss.user_id
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id;

-- 创建存储过程：更新存储使用量
DELIMITER $$

CREATE PROCEDURE UpdateStorageUsage(
  IN p_user_id INT,
  IN p_category ENUM('images', 'videos', 'files', 'cache'),
  IN p_size_change BIGINT
)
BEGIN
  DECLARE v_current_used BIGINT DEFAULT 0;
  DECLARE v_category_used BIGINT DEFAULT 0;
  
  -- 获取当前使用量
  SELECT storage_used INTO v_current_used
  FROM user_storage_settings 
  WHERE user_id = p_user_id;
  
  -- 更新分类使用量和总使用量
  CASE p_category
    WHEN 'images' THEN
      UPDATE user_storage_settings 
      SET 
        images_used = GREATEST(0, images_used + p_size_change),
        storage_used = GREATEST(0, storage_used + p_size_change),
        updated_at = NOW()
      WHERE user_id = p_user_id;
      
    WHEN 'videos' THEN
      UPDATE user_storage_settings 
      SET 
        videos_used = GREATEST(0, videos_used + p_size_change),
        storage_used = GREATEST(0, storage_used + p_size_change),
        updated_at = NOW()
      WHERE user_id = p_user_id;
      
    WHEN 'files' THEN
      UPDATE user_storage_settings 
      SET 
        files_used = GREATEST(0, files_used + p_size_change),
        storage_used = GREATEST(0, storage_used + p_size_change),
        updated_at = NOW()
      WHERE user_id = p_user_id;
      
    WHEN 'cache' THEN
      UPDATE user_storage_settings 
      SET 
        cache_used = GREATEST(0, cache_used + p_size_change),
        storage_used = GREATEST(0, storage_used + p_size_change),
        updated_at = NOW()
      WHERE user_id = p_user_id;
  END CASE;
  
END$$

DELIMITER ;

-- 创建函数：检查存储配额
DELIMITER $$

CREATE FUNCTION CheckStorageQuota(
  p_user_id INT,
  p_additional_size BIGINT
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_quota BIGINT;
  DECLARE v_used BIGINT;
  
  SELECT storage_quota, storage_used 
  INTO v_quota, v_used
  FROM user_storage_settings 
  WHERE user_id = p_user_id;
  
  RETURN (v_used + p_additional_size) <= v_quota;
END$$

DELIMITER ;
