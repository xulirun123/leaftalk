-- 墓地导航系统相关数据表

-- 墓地信息表
CREATE TABLE IF NOT EXISTS cemeteries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '墓地名称',
    address TEXT COMMENT '墓地地址',
    latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
    longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
    altitude DECIMAL(8, 2) DEFAULT NULL COMMENT '海拔高度',
    cemetery_type ENUM('public', 'private', 'family', 'temple') DEFAULT 'public' COMMENT '墓地类型',
    description TEXT COMMENT '墓地描述',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    opening_hours TEXT COMMENT '开放时间',
    facilities JSON COMMENT '设施信息',
    photos JSON COMMENT '墓地照片',
    created_by INT COMMENT '创建者用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_cemetery_type (cemetery_type),
    INDEX idx_created_by (created_by)
) COMMENT='墓地基础信息表';

-- 墓位信息表
CREATE TABLE IF NOT EXISTS grave_sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cemetery_id INT NOT NULL COMMENT '所属墓地ID',
    site_number VARCHAR(50) COMMENT '墓位编号',
    section VARCHAR(50) COMMENT '区域/排号',
    latitude DECIMAL(10, 8) COMMENT '精确纬度',
    longitude DECIMAL(11, 8) COMMENT '精确经度',
    site_type ENUM('single', 'double', 'family', 'columbarium') DEFAULT 'single' COMMENT '墓位类型',
    size_info VARCHAR(100) COMMENT '墓位规格',
    price DECIMAL(10, 2) COMMENT '价格',
    status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available' COMMENT '状态',
    orientation VARCHAR(20) COMMENT '朝向',
    features JSON COMMENT '特色功能',
    photos JSON COMMENT '墓位照片',
    notes TEXT COMMENT '备注信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cemetery_id) REFERENCES cemeteries(id) ON DELETE CASCADE,
    INDEX idx_cemetery_site (cemetery_id, site_number),
    INDEX idx_location (latitude, longitude),
    INDEX idx_status (status)
) COMMENT='墓位详细信息表';

-- 逝者墓位关联表
CREATE TABLE IF NOT EXISTS deceased_grave_sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT NOT NULL COMMENT '逝者ID（关联family_members表）',
    grave_site_id INT NOT NULL COMMENT '墓位ID',
    burial_date DATE COMMENT '安葬日期',
    burial_type ENUM('burial', 'cremation', 'sea_burial', 'other') DEFAULT 'burial' COMMENT '安葬方式',
    epitaph TEXT COMMENT '墓志铭',
    monument_info JSON COMMENT '墓碑信息',
    is_primary BOOLEAN DEFAULT TRUE COMMENT '是否主要墓位',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grave_site_id) REFERENCES grave_sites(id) ON DELETE CASCADE,
    INDEX idx_person_id (person_id),
    INDEX idx_grave_site_id (grave_site_id),
    INDEX idx_burial_date (burial_date)
) COMMENT='逝者与墓位关联表';

-- 祭拜记录表
CREATE TABLE IF NOT EXISTS worship_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grave_site_id INT NOT NULL COMMENT '墓位ID',
    user_id INT NOT NULL COMMENT '祭拜者用户ID',
    worship_date DATE NOT NULL COMMENT '祭拜日期',
    worship_time TIME COMMENT '祭拜时间',
    worship_type ENUM('traditional', 'modern', 'online', 'memorial_day') DEFAULT 'traditional' COMMENT '祭拜类型',
    offerings JSON COMMENT '供品信息',
    prayers TEXT COMMENT '祈祷内容',
    photos JSON COMMENT '祭拜照片',
    videos JSON COMMENT '祭拜视频',
    location_verified BOOLEAN DEFAULT FALSE COMMENT '位置验证',
    weather_info JSON COMMENT '天气信息',
    companions JSON COMMENT '同行人员',
    notes TEXT COMMENT '祭拜感想',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grave_site_id) REFERENCES grave_sites(id) ON DELETE CASCADE,
    INDEX idx_grave_site_date (grave_site_id, worship_date),
    INDEX idx_user_id (user_id),
    INDEX idx_worship_date (worship_date)
) COMMENT='祭拜记录表';

-- 导航路线表
CREATE TABLE IF NOT EXISTS navigation_routes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    cemetery_id INT NOT NULL COMMENT '目标墓地ID',
    grave_site_id INT COMMENT '具体墓位ID',
    start_latitude DECIMAL(10, 8) NOT NULL COMMENT '起点纬度',
    start_longitude DECIMAL(11, 8) NOT NULL COMMENT '起点经度',
    start_address TEXT COMMENT '起点地址',
    route_data JSON COMMENT '路线详细数据',
    distance_km DECIMAL(8, 2) COMMENT '距离（公里）',
    estimated_time INT COMMENT '预计时间（分钟）',
    transport_mode ENUM('driving', 'walking', 'transit', 'cycling') DEFAULT 'driving' COMMENT '交通方式',
    route_preferences JSON COMMENT '路线偏好',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_cemetery (user_id, cemetery_id),
    INDEX idx_created_at (created_at)
) COMMENT='导航路线记录表';

-- 墓地收藏表
CREATE TABLE IF NOT EXISTS cemetery_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    cemetery_id INT COMMENT '墓地ID',
    grave_site_id INT COMMENT '墓位ID',
    favorite_type ENUM('cemetery', 'grave_site', 'route') DEFAULT 'cemetery' COMMENT '收藏类型',
    alias VARCHAR(100) COMMENT '自定义别名',
    notes TEXT COMMENT '备注',
    visit_count INT DEFAULT 0 COMMENT '访问次数',
    last_visit_at TIMESTAMP NULL COMMENT '最后访问时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_favorite (user_id, cemetery_id, grave_site_id, favorite_type),
    INDEX idx_user_id (user_id),
    INDEX idx_favorite_type (favorite_type)
) COMMENT='墓地收藏表';

-- 离线地图数据表
CREATE TABLE IF NOT EXISTS offline_map_tiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tile_key VARCHAR(100) NOT NULL COMMENT '瓦片键值',
    zoom_level INT NOT NULL COMMENT '缩放级别',
    tile_x INT NOT NULL COMMENT 'X坐标',
    tile_y INT NOT NULL COMMENT 'Y坐标',
    tile_data LONGBLOB COMMENT '瓦片数据',
    map_provider VARCHAR(50) DEFAULT 'amap' COMMENT '地图提供商',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP COMMENT '过期时间',
    UNIQUE KEY unique_tile (tile_key, zoom_level, tile_x, tile_y, map_provider),
    INDEX idx_location (zoom_level, tile_x, tile_y),
    INDEX idx_expires_at (expires_at)
) COMMENT='离线地图瓦片数据表';

-- 语音导航记录表
CREATE TABLE IF NOT EXISTS voice_navigation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    navigation_id INT COMMENT '导航记录ID',
    instruction_text TEXT NOT NULL COMMENT '导航指令文本',
    instruction_audio LONGBLOB COMMENT '语音数据',
    instruction_type ENUM('turn', 'continue', 'arrive', 'warning', 'info') DEFAULT 'info' COMMENT '指令类型',
    distance_to_action INT COMMENT '距离操作点距离（米）',
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '播放时间',
    INDEX idx_user_navigation (user_id, navigation_id),
    INDEX idx_played_at (played_at)
) COMMENT='语音导航记录表';

-- 墓地评价表
CREATE TABLE IF NOT EXISTS cemetery_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cemetery_id INT NOT NULL COMMENT '墓地ID',
    user_id INT NOT NULL COMMENT '评价用户ID',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5) COMMENT '评分1-5',
    review_text TEXT COMMENT '评价内容',
    review_photos JSON COMMENT '评价照片',
    visit_date DATE COMMENT '访问日期',
    helpful_count INT DEFAULT 0 COMMENT '有用数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cemetery_id) REFERENCES cemeteries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_cemetery_review (user_id, cemetery_id),
    INDEX idx_cemetery_rating (cemetery_id, rating),
    INDEX idx_created_at (created_at)
) COMMENT='墓地评价表';

-- 插入示例数据
INSERT INTO cemeteries (name, address, latitude, longitude, cemetery_type, description, contact_phone, opening_hours) VALUES
('北京八宝山人民公墓', '北京市石景山区八宝山', 39.9075, 116.1889, 'public', '北京市重要的公共墓地，环境优美，交通便利', '010-68874444', '08:00-17:00'),
('上海福寿园', '上海市青浦区徐泾镇', 31.1951, 121.3424, 'private', '现代化园林式墓园，设施完善', '021-59860000', '08:00-16:30'),
('广州银河公墓', '广州市白云区太和镇', 23.2681, 113.3890, 'public', '广州市大型公共墓地', '020-87041234', '08:00-17:30');

INSERT INTO grave_sites (cemetery_id, site_number, section, latitude, longitude, site_type, status) VALUES
(1, 'A001', '甲区第1排', 39.9076, 116.1890, 'double', 'occupied'),
(1, 'A002', '甲区第1排', 39.9076, 116.1891, 'single', 'available'),
(2, 'B101', '乙区第10排', 31.1952, 121.3425, 'family', 'occupied'),
(3, 'C201', '丙区第20排', 23.2682, 113.3891, 'single', 'occupied');
