-- 用户隐私设置表
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- 朋友权限
  phone_searchable BOOLEAN DEFAULT TRUE COMMENT '可通过手机号搜索到我',
  yeyu_id_searchable BOOLEAN DEFAULT TRUE COMMENT '可通过叶语号搜索到我',
  need_verification BOOLEAN DEFAULT TRUE COMMENT '加我为朋友时需要验证',
  recommend_friends BOOLEAN DEFAULT TRUE COMMENT '向我推荐可能认识的人',
  
  -- 朋友圈权限
  moments_visible_range ENUM('all', 'recent_3_days', 'recent_week', 'recent_month', 'recent_3_months', 'recent_6_months') DEFAULT 'recent_3_days' COMMENT '朋友圈可见范围',
  moments_blacklist JSON COMMENT '朋友圈黑名单（不让他看我的朋友圈）',
  moments_whitelist JSON COMMENT '朋友圈白名单（不看他的朋友圈）',
  
  -- 个人信息权限
  allow_stranger_photos BOOLEAN DEFAULT FALSE COMMENT '允许陌生人查看十张照片',
  show_real_name BOOLEAN DEFAULT TRUE COMMENT '显示真实姓名',
  show_phone BOOLEAN DEFAULT FALSE COMMENT '显示手机号',
  show_email BOOLEAN DEFAULT FALSE COMMENT '显示邮箱',
  show_region BOOLEAN DEFAULT TRUE COMMENT '显示地区',
  show_signature BOOLEAN DEFAULT TRUE COMMENT '显示个性签名',
  
  -- 位置权限
  share_location BOOLEAN DEFAULT TRUE COMMENT '允许分享位置',
  location_accuracy ENUM('precise', 'approximate', 'city_only') DEFAULT 'approximate' COMMENT '位置精度',
  
  -- 数据权限
  allow_data_collection BOOLEAN DEFAULT TRUE COMMENT '允许数据收集',
  allow_personalization BOOLEAN DEFAULT TRUE COMMENT '允许个性化推荐',
  allow_third_party_sharing BOOLEAN DEFAULT FALSE COMMENT '允许第三方数据分享',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_privacy (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_phone_searchable (phone_searchable),
  INDEX idx_yeyu_id_searchable (yeyu_id_searchable),
  INDEX idx_need_verification (need_verification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户隐私设置表';

-- 插入默认隐私设置（为现有用户）
INSERT IGNORE INTO user_privacy_settings (
  user_id, phone_searchable, yeyu_id_searchable, need_verification,
  recommend_friends, moments_visible_range, moments_blacklist, moments_whitelist,
  allow_stranger_photos, show_real_name, show_phone, show_email,
  show_region, show_signature, share_location, location_accuracy,
  allow_data_collection, allow_personalization, allow_third_party_sharing
)
SELECT 
  id as user_id,
  TRUE as phone_searchable,
  TRUE as yeyu_id_searchable,
  TRUE as need_verification,
  TRUE as recommend_friends,
  'recent_3_days' as moments_visible_range,
  JSON_ARRAY() as moments_blacklist,
  JSON_ARRAY() as moments_whitelist,
  FALSE as allow_stranger_photos,
  TRUE as show_real_name,
  FALSE as show_phone,
  FALSE as show_email,
  TRUE as show_region,
  TRUE as show_signature,
  TRUE as share_location,
  'approximate' as location_accuracy,
  TRUE as allow_data_collection,
  TRUE as allow_personalization,
  FALSE as allow_third_party_sharing
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings);

-- 朋友圈隐私日志表（记录隐私设置变更）
CREATE TABLE IF NOT EXISTS privacy_change_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  setting_type ENUM('friend_permission', 'moments_permission', 'personal_info', 'location', 'data_usage') NOT NULL COMMENT '设置类型',
  setting_key VARCHAR(50) NOT NULL COMMENT '设置键名',
  old_value TEXT COMMENT '旧值',
  new_value TEXT COMMENT '新值',
  change_reason VARCHAR(255) COMMENT '变更原因',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_setting (user_id, setting_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='隐私设置变更日志表';

-- 朋友圈可见性缓存表（优化朋友圈查询性能）
CREATE TABLE IF NOT EXISTS moments_visibility_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '朋友圈发布者',
  viewer_id INT NOT NULL COMMENT '查看者',
  is_visible BOOLEAN DEFAULT TRUE COMMENT '是否可见',
  visibility_reason ENUM('normal', 'blacklisted', 'time_limited', 'stranger_limited') DEFAULT 'normal' COMMENT '可见性原因',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_viewer (user_id, viewer_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_viewer_visible (viewer_id, is_visible),
  INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈可见性缓存表';

-- 创建触发器：当隐私设置变更时，清理相关缓存
DELIMITER $$

CREATE TRIGGER privacy_settings_after_update
AFTER UPDATE ON user_privacy_settings
FOR EACH ROW
BEGIN
  -- 如果朋友圈相关设置发生变化，清理可见性缓存
  IF (OLD.moments_visible_range != NEW.moments_visible_range 
      OR OLD.moments_blacklist != NEW.moments_blacklist 
      OR OLD.moments_whitelist != NEW.moments_whitelist) THEN
    
    DELETE FROM moments_visibility_cache 
    WHERE user_id = NEW.user_id OR viewer_id = NEW.user_id;
    
  END IF;
END$$

DELIMITER ;

-- 创建视图：用户隐私摘要
CREATE OR REPLACE VIEW user_privacy_summary AS
SELECT 
  u.id as user_id,
  u.nickname,
  u.phone,
  u.yeyu_id,
  ups.phone_searchable,
  ups.yeyu_id_searchable,
  ups.need_verification,
  ups.moments_visible_range,
  JSON_LENGTH(ups.moments_blacklist) as blacklist_count,
  JSON_LENGTH(ups.moments_whitelist) as whitelist_count,
  ups.allow_stranger_photos,
  ups.share_location,
  ups.location_accuracy,
  ups.updated_at as privacy_updated_at
FROM users u
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id;

-- 创建存储过程：检查朋友圈可见性
DELIMITER $$

CREATE PROCEDURE CheckMomentsVisibility(
  IN p_user_id INT,
  IN p_viewer_id INT,
  OUT p_is_visible BOOLEAN,
  OUT p_reason VARCHAR(50)
)
BEGIN
  DECLARE v_visible_range VARCHAR(20);
  DECLARE v_blacklist JSON;
  DECLARE v_whitelist JSON;
  DECLARE v_is_friend BOOLEAN DEFAULT FALSE;
  DECLARE v_friendship_date DATE;
  
  -- 检查是否是朋友关系
  SELECT COUNT(*) > 0, MIN(created_at)
  INTO v_is_friend, v_friendship_date
  FROM friends 
  WHERE (user_id = p_user_id AND friend_id = p_viewer_id)
     OR (user_id = p_viewer_id AND friend_id = p_user_id)
     AND status = 'accepted';
  
  -- 如果不是朋友，默认不可见
  IF NOT v_is_friend THEN
    SET p_is_visible = FALSE;
    SET p_reason = 'not_friend';
  ELSE
    -- 获取隐私设置
    SELECT 
      COALESCE(moments_visible_range, 'recent_3_days'),
      COALESCE(moments_blacklist, JSON_ARRAY()),
      COALESCE(moments_whitelist, JSON_ARRAY())
    INTO v_visible_range, v_blacklist, v_whitelist
    FROM user_privacy_settings 
    WHERE user_id = p_user_id;
    
    -- 检查黑名单
    IF JSON_CONTAINS(v_blacklist, CAST(p_viewer_id AS JSON)) THEN
      SET p_is_visible = FALSE;
      SET p_reason = 'blacklisted';
    -- 检查时间范围
    ELSEIF v_visible_range != 'all' THEN
      CASE v_visible_range
        WHEN 'recent_3_days' THEN
          SET p_is_visible = (v_friendship_date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY));
        WHEN 'recent_week' THEN
          SET p_is_visible = (v_friendship_date >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK));
        WHEN 'recent_month' THEN
          SET p_is_visible = (v_friendship_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH));
        WHEN 'recent_3_months' THEN
          SET p_is_visible = (v_friendship_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH));
        WHEN 'recent_6_months' THEN
          SET p_is_visible = (v_friendship_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH));
        ELSE
          SET p_is_visible = TRUE;
      END CASE;
      
      IF NOT p_is_visible THEN
        SET p_reason = 'time_limited';
      ELSE
        SET p_reason = 'normal';
      END IF;
    ELSE
      SET p_is_visible = TRUE;
      SET p_reason = 'normal';
    END IF;
  END IF;
  
END$$

DELIMITER ;

-- 创建函数：获取用户搜索权限
DELIMITER $$

CREATE FUNCTION CanSearchUser(
  p_searcher_id INT,
  p_target_id INT,
  p_search_type ENUM('phone', 'yeyu_id')
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_searchable BOOLEAN DEFAULT FALSE;
  
  -- 获取目标用户的搜索权限设置
  IF p_search_type = 'phone' THEN
    SELECT COALESCE(phone_searchable, TRUE) 
    INTO v_searchable
    FROM user_privacy_settings 
    WHERE user_id = p_target_id;
  ELSEIF p_search_type = 'yeyu_id' THEN
    SELECT COALESCE(yeyu_id_searchable, TRUE) 
    INTO v_searchable
    FROM user_privacy_settings 
    WHERE user_id = p_target_id;
  END IF;
  
  RETURN v_searchable;
END$$

DELIMITER ;
