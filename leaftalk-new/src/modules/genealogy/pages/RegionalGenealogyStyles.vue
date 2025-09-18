<template>
  <div class="genealogy-layout-styles">

    <!-- 布局选择器 -->
    <div class="layout-selector">
      <div class="selector-header">
        <h3>选择排版布局</h3>
        <div class="current-layout">当前：{{ getCurrentLayoutName() }}</div>
      </div>

      <div class="layout-grid">
        <div
          v-for="layout in genealogyLayouts"
          :key="layout.id"
          @click="selectLayout(layout)"
          :class="{ active: selectedLayout === layout.id }"
          class="layout-card"
        >
          <div class="layout-preview" :class="layout.id">
            <div class="preview-content">
              <!-- 根据不同布局显示不同的预览结构 -->
              <div v-if="layout.id === 'european'" class="european-preview">
                <div class="generation-row">
                  <div class="member-node patriarch">
                    <img src="/mock-avatar-1.jpg" alt="始祖" />
                    <div class="member-name">始祖</div>
                  </div>
                </div>
                <div class="generation-row">
                  <div class="member-node">
                    <img src="/mock-avatar-2.jpg" alt="长子" />
                    <div class="member-name">长子</div>
                  </div>
                  <div class="member-node">
                    <img src="/mock-avatar-3.jpg" alt="次子" />
                    <div class="member-name">次子</div>
                  </div>
                </div>
              </div>

              <div v-else-if="layout.id === 'suzhou'" class="suzhou-preview">
                <div class="ancestor-section">
                  <div class="member-node patriarch">
                    <img src="/mock-avatar-1.jpg" alt="祖先" />
                    <div class="member-name">祖先</div>
                  </div>
                </div>
                <div class="descendants-section">
                  <div class="branch">
                    <div class="member-node">
                      <img src="/mock-avatar-2.jpg" alt="长房" />
                      <div class="member-name">长房</div>
                    </div>
                    <div class="sub-members">
                      <div class="member-node small">
                        <img src="/mock-avatar-4.jpg" alt="孙" />
                      </div>
                    </div>
                  </div>
                  <div class="branch">
                    <div class="member-node">
                      <img src="/mock-avatar-3.jpg" alt="二房" />
                      <div class="member-name">二房</div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="layout.id === 'pagoda'" class="pagoda-preview">
                <div class="pagoda-level level-1">
                  <div class="member-node patriarch">
                    <img src="/mock-avatar-1.jpg" alt="顶层" />
                    <div class="member-name">始祖</div>
                  </div>
                </div>
                <div class="pagoda-level level-2">
                  <div class="member-node">
                    <img src="/mock-avatar-2.jpg" alt="二层" />
                  </div>
                  <div class="member-node">
                    <img src="/mock-avatar-3.jpg" alt="二层" />
                  </div>
                </div>
                <div class="pagoda-level level-3">
                  <div class="member-node small">
                    <img src="/mock-avatar-4.jpg" alt="三层" />
                  </div>
                  <div class="member-node small">
                    <img src="/mock-avatar-5.jpg" alt="三层" />
                  </div>
                  <div class="member-node small">
                    <img src="/mock-avatar-6.jpg" alt="三层" />
                  </div>
                </div>
              </div>

              <div v-else-if="layout.id === 'fan'" class="fan-preview">
                <div class="fan-center">
                  <div class="member-node patriarch">
                    <img src="/mock-avatar-1.jpg" alt="中心" />
                    <div class="member-name">祖先</div>
                  </div>
                </div>
                <div class="fan-branches">
                  <div class="fan-branch" style="transform: rotate(-30deg)">
                    <div class="member-node small">
                      <img src="/mock-avatar-2.jpg" alt="分支" />
                    </div>
                  </div>
                  <div class="fan-branch" style="transform: rotate(0deg)">
                    <div class="member-node small">
                      <img src="/mock-avatar-3.jpg" alt="分支" />
                    </div>
                  </div>
                  <div class="fan-branch" style="transform: rotate(30deg)">
                    <div class="member-node small">
                      <img src="/mock-avatar-4.jpg" alt="分支" />
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="layout.id === 'tree'" class="tree-preview">
                <div class="tree-trunk">
                  <div class="member-node patriarch">
                    <img src="/mock-avatar-1.jpg" alt="树根" />
                    <div class="member-name">根</div>
                  </div>
                </div>
                <div class="tree-branches">
                  <div class="branch-left">
                    <div class="member-node">
                      <img src="/mock-avatar-2.jpg" alt="左枝" />
                    </div>
                  </div>
                  <div class="branch-right">
                    <div class="member-node">
                      <img src="/mock-avatar-3.jpg" alt="右枝" />
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="layout.id === 'circular'" class="circular-preview">
                <div class="circle-center">
                  <div class="member-node patriarch small">
                    <img src="/mock-avatar-1.jpg" alt="中心" />
                  </div>
                </div>
                <div class="circle-ring">
                  <div class="member-node small" style="transform: rotate(0deg) translateY(-40px)">
                    <img src="/mock-avatar-2.jpg" alt="环形" />
                  </div>
                  <div class="member-node small" style="transform: rotate(120deg) translateY(-40px)">
                    <img src="/mock-avatar-3.jpg" alt="环形" />
                  </div>
                  <div class="member-node small" style="transform: rotate(240deg) translateY(-40px)">
                    <img src="/mock-avatar-4.jpg" alt="环形" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="layout-info">
            <div class="layout-name">{{ layout.name }}</div>
            <div class="layout-description">{{ layout.description }}</div>
            <div class="layout-features">
              <span v-for="feature in layout.features" :key="feature" class="feature-tag">
                {{ feature }}
              </span>
            </div>
          </div>

          <div class="layout-meta">
            <div class="popularity">
              <iconify-icon icon="heroicons:users" width="12"></iconify-icon>
              <span>{{ layout.popularity }}%用户使用</span>
            </div>
            <div class="origin">
              <iconify-icon icon="heroicons:academic-cap" width="12"></iconify-icon>
              <span>{{ layout.origin }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 布局定制 -->
    <div class="layout-customization">
      <div class="customization-header">
        <h3>布局定制</h3>
        <button @click="resetCustomization" class="reset-btn">
          <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
          <span>重置</span>
        </button>
      </div>
      
      <div class="customization-tabs">
        <button 
          v-for="tab in customizationTabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-btn"
        >
          <iconify-icon :icon="tab.icon" width="16"></iconify-icon>
          <span>{{ tab.name }}</span>
        </button>
      </div>
      
      <div class="customization-content">
        <!-- 头像设置 -->
        <div v-if="activeTab === 'avatars'" class="avatar-customization">
          <div class="avatar-section">
            <h4>头像显示</h4>
            <div class="avatar-options">
              <div class="avatar-group">
                <label>头像大小</label>
                <div class="size-options">
                  <button
                    v-for="size in avatarSizes"
                    :key="size.id"
                    @click="customization.avatars.size = size.id"
                    :class="{ active: customization.avatars.size === size.id }"
                    class="size-btn"
                  >
                    <div :class="['avatar-preview', size.id]">
                      <img src="/mock-avatar-1.jpg" alt="预览" />
                    </div>
                    <span>{{ size.name }}</span>
                  </button>
                </div>
              </div>

              <div class="avatar-group">
                <label>显示选项</label>
                <div class="display-options">
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.avatars.showAvatars" />
                    <span>显示头像</span>
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.avatars.showNames" />
                    <span>显示姓名</span>
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.avatars.showDates" />
                    <span>显示日期</span>
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.avatars.showTitles" />
                    <span>显示称谓</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 间距设置 -->
        <div v-if="activeTab === 'spacing'" class="spacing-customization">
          <div class="spacing-section">
            <h4>间距调节</h4>
            <div class="spacing-options">
              <div class="spacing-group">
                <label>成员间距</label>
                <input
                  type="range"
                  v-model="customization.spacing.memberSpacing"
                  min="40"
                  max="150"
                  step="10"
                />
                <span>{{ customization.spacing.memberSpacing }}px</span>
              </div>

              <div class="spacing-group">
                <label>世代间距</label>
                <input
                  type="range"
                  v-model="customization.spacing.generationSpacing"
                  min="60"
                  max="200"
                  step="10"
                />
                <span>{{ customization.spacing.generationSpacing }}px</span>
              </div>

              <div class="spacing-group">
                <label>分支间距</label>
                <input
                  type="range"
                  v-model="customization.spacing.branchSpacing"
                  min="40"
                  max="150"
                  step="10"
                />
                <span>{{ customization.spacing.branchSpacing }}px</span>
              </div>

              <div class="spacing-group">
                <label>边距大小</label>
                <input
                  type="range"
                  v-model="customization.spacing.marginSize"
                  min="20"
                  max="80"
                  step="10"
                />
                <span>{{ customization.spacing.marginSize }}px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 连线设置 -->
        <div v-if="activeTab === 'connections'" class="connection-customization">
          <div class="connection-section">
            <h4>连线样式</h4>
            <div class="connection-options">
              <div class="connection-group">
                <label>线条样式</label>
                <select v-model="customization.connections.lineStyle">
                  <option value="solid">实线</option>
                  <option value="dashed">虚线</option>
                  <option value="dotted">点线</option>
                </select>
              </div>

              <div class="connection-group">
                <label>线条粗细</label>
                <input
                  type="range"
                  v-model="customization.connections.lineWidth"
                  min="1"
                  max="5"
                  step="1"
                />
                <span>{{ customization.connections.lineWidth }}px</span>
              </div>

              <div class="connection-group">
                <label>线条颜色</label>
                <input type="color" v-model="customization.connections.lineColor" />
              </div>

              <div class="connection-group">
                <label>连接类型</label>
                <select v-model="customization.connections.connectionType">
                  <option value="straight">直线</option>
                  <option value="orthogonal">直角</option>
                  <option value="curved">曲线</option>
                  <option value="tree">树形</option>
                  <option value="radial">辐射</option>
                </select>
              </div>

              <div class="connection-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="customization.connections.showArrows" />
                  <span>显示箭头</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 装饰元素 -->
        <div v-if="activeTab === 'decorations'" class="decoration-customization">
          <div class="decoration-section">
            <h4>装饰选项</h4>
            <div class="decoration-options">
              <div class="decoration-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="customization.decorations.showBorders" />
                  <span>显示边框</span>
                </label>

                <div v-if="customization.decorations.showBorders" class="sub-options">
                  <select v-model="customization.decorations.borderStyle">
                    <option value="solid">实线边框</option>
                    <option value="dashed">虚线边框</option>
                    <option value="dotted">点线边框</option>
                  </select>
                </div>
              </div>

              <div class="decoration-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="customization.decorations.showShadows" />
                  <span>显示阴影</span>
                </label>

                <div v-if="customization.decorations.showShadows" class="sub-options">
                  <label>阴影强度</label>
                  <input
                    type="range"
                    v-model="customization.decorations.shadowIntensity"
                    min="0.1"
                    max="1"
                    step="0.1"
                  />
                  <span>{{ (customization.decorations.shadowIntensity * 100).toFixed(0) }}%</span>
                </div>
              </div>

              <div class="decoration-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="customization.decorations.showGenerationLabels" />
                  <span>显示世代标签</span>
                </label>
              </div>

              <div class="decoration-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="customization.decorations.showPatriarchCrown" />
                  <span>显示族长标识</span>
                </label>
              </div>

              <div class="decoration-group">
                <label>背景图案</label>
                <select v-model="customization.decorations.backgroundPattern">
                  <option value="none">无图案</option>
                  <option value="grid">网格</option>
                  <option value="dots">圆点</option>
                  <option value="traditional">传统纹样</option>
                </select>
              </div>
            </div>
          </div>
        </div>
              
              <div class="color-group">
                <label>女性节点</label>
                <div class="color-picker-group">
                  <input type="color" v-model="customization.colors.femaleNode" />
                  <div class="color-presets">
                    <div 
                      v-for="color in femaleColorPresets" 
                      :key="color"
                      @click="customization.colors.femaleNode = color"
                      :style="{ backgroundColor: color }"
                      class="color-preset"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="color-group">
                <label>连接线</label>
                <div class="color-picker-group">
                  <input type="color" v-model="customization.colors.connection" />
                  <div class="color-presets">
                    <div 
                      v-for="color in connectionColorPresets" 
                      :key="color"
                      @click="customization.colors.connection = color"
                      :style="{ backgroundColor: color }"
                      class="color-preset"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="color-group">
                <label>背景色</label>
                <div class="color-picker-group">
                  <input type="color" v-model="customization.colors.background" />
                  <div class="color-presets">
                    <div 
                      v-for="color in backgroundColorPresets" 
                      :key="color"
                      @click="customization.colors.background = color"
                      :style="{ backgroundColor: color }"
                      class="color-preset"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 字体设置 -->
        <div v-if="activeTab === 'fonts'" class="font-customization">
          <div class="font-section">
            <h4>字体选择</h4>
            <div class="font-options">
              <div class="font-group">
                <label>主字体</label>
                <select v-model="customization.fonts.primary">
                  <option value="SimSun">宋体</option>
                  <option value="KaiTi">楷体</option>
                  <option value="FangSong">仿宋</option>
                  <option value="LiSu">隶书</option>
                  <option value="YouYuan">幼圆</option>
                  <option value="Microsoft YaHei">微软雅黑</option>
                  <option value="PingFang SC">苹方</option>
                </select>
              </div>
              
              <div class="font-group">
                <label>姓名字号</label>
                <input 
                  type="range" 
                  v-model="customization.fonts.nameSize" 
                  min="12" 
                  max="24" 
                  step="1"
                />
                <span>{{ customization.fonts.nameSize }}px</span>
              </div>
              
              <div class="font-group">
                <label>日期字号</label>
                <input 
                  type="range" 
                  v-model="customization.fonts.dateSize" 
                  min="8" 
                  max="16" 
                  step="1"
                />
                <span>{{ customization.fonts.dateSize }}px</span>
              </div>
              
              <div class="font-group">
                <label>字体粗细</label>
                <select v-model="customization.fonts.weight">
                  <option value="normal">正常</option>
                  <option value="bold">粗体</option>
                  <option value="lighter">细体</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 布局设置 -->
        <div v-if="activeTab === 'layout'" class="layout-customization">
          <div class="layout-section">
            <h4>布局参数</h4>
            <div class="layout-options">
              <div class="layout-group">
                <label>节点形状</label>
                <div class="shape-options">
                  <button 
                    v-for="shape in nodeShapes" 
                    :key="shape.id"
                    @click="customization.layout.nodeShape = shape.id"
                    :class="{ active: customization.layout.nodeShape === shape.id }"
                    class="shape-btn"
                  >
                    <iconify-icon :icon="shape.icon" width="20"></iconify-icon>
                    <span>{{ shape.name }}</span>
                  </button>
                </div>
              </div>
              
              <div class="layout-group">
                <label>节点大小</label>
                <input 
                  type="range" 
                  v-model="customization.layout.nodeSize" 
                  min="60" 
                  max="120" 
                  step="10"
                />
                <span>{{ customization.layout.nodeSize }}px</span>
              </div>
              
              <div class="layout-group">
                <label>节点间距</label>
                <input 
                  type="range" 
                  v-model="customization.layout.nodeSpacing" 
                  min="80" 
                  max="200" 
                  step="10"
                />
                <span>{{ customization.layout.nodeSpacing }}px</span>
              </div>
              
              <div class="layout-group">
                <label>层级间距</label>
                <input 
                  type="range" 
                  v-model="customization.layout.levelSpacing" 
                  min="100" 
                  max="300" 
                  step="20"
                />
                <span>{{ customization.layout.levelSpacing }}px</span>
              </div>
              
              <div class="layout-group">
                <label>连接线样式</label>
                <select v-model="customization.layout.connectionStyle">
                  <option value="straight">直线</option>
                  <option value="curved">曲线</option>
                  <option value="orthogonal">直角</option>
                  <option value="bezier">贝塞尔</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 装饰元素 -->
        <div v-if="activeTab === 'decorations'" class="decoration-customization">
          <div class="decoration-section">
            <h4>装饰元素</h4>
            <div class="decoration-options">
              <div class="decoration-group">
                <label>边框样式</label>
                <div class="border-options">
                  <button 
                    v-for="border in borderStyles" 
                    :key="border.id"
                    @click="customization.decorations.border = border.id"
                    :class="{ active: customization.decorations.border === border.id }"
                    class="border-btn"
                  >
                    <div :class="['border-preview', border.id]"></div>
                    <span>{{ border.name }}</span>
                  </button>
                </div>
              </div>
              
              <div class="decoration-group">
                <label>阴影效果</label>
                <div class="shadow-options">
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.decorations.shadow" />
                    <span>启用阴影</span>
                  </label>
                  <div v-if="customization.decorations.shadow" class="shadow-controls">
                    <div class="shadow-control">
                      <label>阴影强度</label>
                      <input 
                        type="range" 
                        v-model="customization.decorations.shadowIntensity" 
                        min="0.1" 
                        max="1" 
                        step="0.1"
                      />
                      <span>{{ (customization.decorations.shadowIntensity * 100).toFixed(0) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="decoration-group">
                <label>背景图案</label>
                <div class="pattern-options">
                  <button 
                    v-for="pattern in backgroundPatterns" 
                    :key="pattern.id"
                    @click="customization.decorations.pattern = pattern.id"
                    :class="{ active: customization.decorations.pattern === pattern.id }"
                    class="pattern-btn"
                  >
                    <div :class="['pattern-preview', pattern.id]"></div>
                    <span>{{ pattern.name }}</span>
                  </button>
                </div>
              </div>
              
              <div class="decoration-group">
                <label>特殊标记</label>
                <div class="marker-options">
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.decorations.generationMarkers" />
                    <span>世代标记</span>
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.decorations.patriarchCrown" />
                    <span>族长标识</span>
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="customization.decorations.deceasedMarkers" />
                    <span>逝者标记</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时预览 -->
    <div class="live-preview">
      <div class="preview-header">
        <h3>实时预览</h3>
        <div class="preview-controls">
          <button @click="zoomOut" class="zoom-btn">
            <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
          </button>
          <span class="zoom-level">{{ (previewZoom * 100).toFixed(0) }}%</span>
          <button @click="zoomIn" class="zoom-btn">
            <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
          </button>
        </div>
      </div>
      
      <div class="preview-canvas" :style="{ transform: `scale(${previewZoom})` }">
        <div class="genealogy-preview" :class="selectedLayout">
          <!-- 根据选择的布局渲染不同的预览 -->
          <div v-if="selectedLayout === 'european'" class="european-layout">
            <div class="generation-row" v-for="(generation, index) in previewGenerations" :key="index">
              <div
                v-for="member in generation"
                :key="member.id"
                class="preview-member"
                :class="[member.gender, { patriarch: member.isPatriarch, deceased: member.deceased }]"
                :style="getPreviewMemberStyle(member)"
              >
                <div class="member-content">
                  <div v-if="customization.decorations.showGenerationLabels" class="generation-label">
                    {{ getGenerationLabel(index + 1) }}
                  </div>

                  <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                    <img :src="member.avatar" :alt="member.name" />
                  </div>

                  <div v-if="customization.avatars.showNames" class="member-name">{{ member.name }}</div>
                  <div v-if="customization.avatars.showDates && member.dates" class="member-dates">{{ member.dates }}</div>
                  <div v-if="customization.avatars.showTitles && member.title" class="member-title">{{ member.title }}</div>

                  <div v-if="customization.decorations.showPatriarchCrown && member.isPatriarch" class="patriarch-crown">
                    <iconify-icon icon="heroicons:crown" width="16"></iconify-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedLayout === 'suzhou'" class="suzhou-layout">
            <div class="ancestor-section">
              <div class="preview-member patriarch" :style="getPreviewMemberStyle(previewMembers[0])">
                <div class="member-content">
                  <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                    <img :src="previewMembers[0].avatar" :alt="previewMembers[0].name" />
                  </div>
                  <div v-if="customization.avatars.showNames" class="member-name">{{ previewMembers[0].name }}</div>
                </div>
              </div>
            </div>
            <div class="branches-section">
              <div v-for="branch in previewBranches" :key="branch.id" class="family-branch">
                <div class="branch-head">
                  <div class="preview-member" :style="getPreviewMemberStyle(branch.head)">
                    <div class="member-content">
                      <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                        <img :src="branch.head.avatar" :alt="branch.head.name" />
                      </div>
                      <div v-if="customization.avatars.showNames" class="member-name">{{ branch.head.name }}</div>
                    </div>
                  </div>
                </div>
                <div class="branch-members">
                  <div v-for="member in branch.members" :key="member.id" class="preview-member small">
                    <div v-if="customization.avatars.showAvatars" class="member-avatar small">
                      <img :src="member.avatar" :alt="member.name" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedLayout === 'pagoda'" class="pagoda-layout">
            <div v-for="(level, index) in previewPagodaLevels" :key="index" class="pagoda-level" :class="`level-${index + 1}`">
              <div
                v-for="member in level"
                :key="member.id"
                class="preview-member"
                :class="{ patriarch: member.isPatriarch }"
                :style="getPreviewMemberStyle(member)"
              >
                <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                  <img :src="member.avatar" :alt="member.name" />
                </div>
                <div v-if="customization.avatars.showNames" class="member-name">{{ member.name }}</div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedLayout === 'fan'" class="fan-layout">
            <div class="fan-center">
              <div class="preview-member patriarch" :style="getPreviewMemberStyle(previewMembers[0])">
                <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                  <img :src="previewMembers[0].avatar" :alt="previewMembers[0].name" />
                </div>
                <div v-if="customization.avatars.showNames" class="member-name">{{ previewMembers[0].name }}</div>
              </div>
            </div>
            <div class="fan-branches">
              <div
                v-for="(member, index) in previewMembers.slice(1)"
                :key="member.id"
                class="fan-branch"
                :style="{ transform: `rotate(${(index - 1) * 60}deg)` }"
              >
                <div class="preview-member" :style="getPreviewMemberStyle(member)">
                  <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                    <img :src="member.avatar" :alt="member.name" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedLayout === 'tree'" class="tree-layout">
            <div class="tree-root">
              <div class="preview-member patriarch" :style="getPreviewMemberStyle(previewMembers[0])">
                <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                  <img :src="previewMembers[0].avatar" :alt="previewMembers[0].name" />
                </div>
                <div v-if="customization.avatars.showNames" class="member-name">{{ previewMembers[0].name }}</div>
              </div>
            </div>
            <div class="tree-branches">
              <div class="branch-left">
                <div class="preview-member" :style="getPreviewMemberStyle(previewMembers[1])">
                  <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                    <img :src="previewMembers[1].avatar" :alt="previewMembers[1].name" />
                  </div>
                </div>
              </div>
              <div class="branch-right">
                <div class="preview-member" :style="getPreviewMemberStyle(previewMembers[2])">
                  <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                    <img :src="previewMembers[2].avatar" :alt="previewMembers[2].name" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedLayout === 'circular'" class="circular-layout">
            <div class="circle-center">
              <div class="preview-member patriarch" :style="getPreviewMemberStyle(previewMembers[0])">
                <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                  <img :src="previewMembers[0].avatar" :alt="previewMembers[0].name" />
                </div>
                <div v-if="customization.avatars.showNames" class="member-name">{{ previewMembers[0].name }}</div>
              </div>
            </div>
            <div class="circle-ring">
              <div
                v-for="(member, index) in previewMembers.slice(1)"
                :key="member.id"
                class="preview-member"
                :style="{
                  transform: `rotate(${index * 120}deg) translateY(-60px)`,
                  ...getPreviewMemberStyle(member)
                }"
              >
                <div v-if="customization.avatars.showAvatars" class="member-avatar" :style="getAvatarStyle()">
                  <img :src="member.avatar" :alt="member.name" />
                </div>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <svg class="preview-connections" v-if="customization.connections.connectionType !== 'none'">
            <path
              v-for="connection in getPreviewConnections()"
              :key="connection.id"
              :d="connection.path"
              :stroke="customization.connections.lineColor"
              :stroke-width="customization.connections.lineWidth"
              :stroke-dasharray="getStrokeDashArray()"
              fill="none"
              :marker-end="customization.connections.showArrows ? 'url(#arrowhead)' : ''"
            />

            <!-- 箭头标记 -->
            <defs v-if="customization.connections.showArrows">
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" :fill="customization.connections.lineColor" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="saveAsTemplate" class="save-template-btn">
        <iconify-icon icon="heroicons:bookmark" width="16"></iconify-icon>
        <span>保存为模板</span>
      </button>
      <button @click="applyLayout" class="apply-btn">
        <iconify-icon icon="heroicons:check" width="16"></iconify-icon>
        <span>应用布局</span>
      </button>
    </div>

    <!-- 布局指南弹窗 -->
    <div v-if="showLayoutGuide" class="modal-overlay" @click="showLayoutGuide = false">
      <div class="layout-guide-modal" @click.stop>
        <div class="modal-header">
          <h3>族谱排版布局指南</h3>
          <button @click="showLayoutGuide = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="modal-content">
          <div class="guide-sections">
            <div v-for="layout in genealogyLayouts" :key="layout.id" class="guide-section">
              <h4>{{ layout.name }}</h4>
              <div class="guide-content">
                <div class="guide-description">{{ layout.fullDescription }}</div>
                <div class="guide-characteristics">
                  <h5>布局特点</h5>
                  <ul>
                    <li v-for="characteristic in layout.characteristics" :key="characteristic">
                      {{ characteristic }}
                    </li>
                  </ul>
                </div>
                <div class="guide-usage">
                  <h5>适用场景</h5>
                  <div class="usage-text">{{ layout.usage }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32"></iconify-icon>
      </div>
      <div class="loading-text">正在应用风格...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// 状态
const isLoading = ref(false)
const showLayoutGuide = ref(false)
const selectedLayout = ref('european')
const activeTab = ref('avatars')
const previewZoom = ref(0.8)

// 定制化选项卡
const customizationTabs = ref([
  { id: 'avatars', name: '头像设置', icon: 'heroicons:user-circle' },
  { id: 'spacing', name: '间距设置', icon: 'heroicons:arrows-pointing-out' },
  { id: 'connections', name: '连线设置', icon: 'heroicons:link' },
  { id: 'decorations', name: '装饰元素', icon: 'heroicons:sparkles' }
])

// 头像大小选项
const avatarSizes = ref([
  { id: 'small', name: '小', size: 32 },
  { id: 'medium', name: '中', size: 48 },
  { id: 'large', name: '大', size: 64 },
  { id: 'xlarge', name: '特大', size: 80 }
])

// 族谱排版布局数据
const genealogyLayouts = ref([
  {
    id: 'european',
    name: '欧式排版',
    description: '横向展开，层次分明的欧式族谱布局',
    fullDescription: '欧式排版是最经典的族谱布局方式，以横向展开为主，每一代人员排成一行，层次分明，便于阅读和理解家族关系。',
    origin: '欧洲传统',
    popularity: 35,
    features: ['横向排列', '层次分明', '便于阅读', '经典布局'],
    characteristics: [
      '每代成员横向排列在同一行',
      '上下代之间用连线表示血缘关系',
      '配偶关系用横线连接',
      '布局清晰，易于理解',
      '适合大型家族展示'
    ],
    usage: '适用于成员较多的大型家族，特别是需要清晰展示世代关系的场合。',
    layoutParams: {
      direction: 'horizontal',
      spacing: 'wide',
      alignment: 'center'
    }
  },
  {
    id: 'suzhou',
    name: '苏式排版',
    description: '纵向展开，分房明确的苏式族谱布局',
    fullDescription: '苏式排版源于江南地区的传统族谱制作方式，以纵向展开为主，强调分房分支，体现了江南文化的精细和条理。',
    origin: '江南传统',
    popularity: 28,
    features: ['纵向排列', '分房明确', '精细布局', '传统美观'],
    characteristics: [
      '祖先位于顶部中央位置',
      '子孙按房分支纵向排列',
      '每房独立成列，界限分明',
      '强调长幼有序，房分清晰',
      '适合展示复杂的分房关系'
    ],
    usage: '适用于分房较多的传统家族，特别是需要明确展示房分关系的场合。',
    layoutParams: {
      direction: 'vertical',
      spacing: 'medium',
      alignment: 'top'
    }
  },
  {
    id: 'pagoda',
    name: '宝塔式排版',
    description: '塔形结构，层层递进的宝塔式布局',
    fullDescription: '宝塔式排版模仿古代宝塔的层次结构，从上到下逐层展开，象征着家族的根基深厚，枝繁叶茂。',
    origin: '中式传统',
    popularity: 22,
    features: ['塔形结构', '层次递进', '象征意义', '视觉美观'],
    characteristics: [
      '始祖位于塔顶，地位尊崇',
      '每层人数逐渐增加，形成塔形',
      '层与层之间有明确的等级关系',
      '视觉效果强烈，寓意深刻',
      '适合强调家族传承的重要性'
    ],
    usage: '适用于希望强调家族传承和等级秩序的场合，具有很强的象征意义。',
    layoutParams: {
      direction: 'pyramid',
      spacing: 'compact',
      alignment: 'center'
    }
  },
  {
    id: 'fan',
    name: '扇形排版',
    description: '扇形展开，辐射分布的扇形布局',
    fullDescription: '扇形排版以祖先为中心，子孙如扇形般向外辐射展开，象征着家族的繁荣昌盛，枝叶满天下。',
    origin: '创新设计',
    popularity: 18,
    features: ['扇形展开', '辐射分布', '中心突出', '动态美感'],
    characteristics: [
      '祖先位于扇形的中心点',
      '后代按扇形角度分布',
      '每个分支独立展开',
      '具有很强的视觉冲击力',
      '适合展示家族的繁荣发展'
    ],
    usage: '适用于希望展示家族繁荣发展的场合，具有现代感和动态美。',
    layoutParams: {
      direction: 'radial',
      spacing: 'wide',
      alignment: 'center'
    }
  },
  {
    id: 'tree',
    name: '树形排版',
    description: '树状结构，自然生长的树形布局',
    fullDescription: '树形排版模仿自然界大树的生长形态，从根部开始，逐渐分枝展叶，象征着家族如大树般根深叶茂。',
    origin: '自然仿生',
    popularity: 25,
    features: ['树状结构', '自然形态', '分枝清晰', '生动形象'],
    characteristics: [
      '根部代表家族始祖',
      '主干和分枝代表不同世代',
      '枝叶代表家族成员',
      '结构自然，易于理解',
      '具有很强的象征意义'
    ],
    usage: '适用于希望体现家族自然传承和生生不息的场合，寓意深刻。',
    layoutParams: {
      direction: 'tree',
      spacing: 'natural',
      alignment: 'root'
    }
  },
  {
    id: 'circular',
    name: '环形排版',
    description: '环形分布，循环展示的环形布局',
    fullDescription: '环形排版将家族成员按环形分布，象征着家族的团结和谐，生生不息的循环传承。',
    origin: '现代创新',
    popularity: 15,
    features: ['环形分布', '循环展示', '团结象征', '现代美感'],
    characteristics: [
      '祖先位于环形中心',
      '各代成员按环形分布',
      '强调家族的团结和谐',
      '具有现代设计感',
      '适合小型家族展示'
    ],
    usage: '适用于成员相对较少的家族，强调团结和谐的家族理念。',
    layoutParams: {
      direction: 'circular',
      spacing: 'even',
      alignment: 'center'
    }
  }
])

// 颜色预设
const maleColorPresets = ref(['#E3F2FD', '#E8F5E8', '#FFF3E0', '#F3E5F5', '#E0F2F1', '#FFF8E1'])
const femaleColorPresets = ref(['#FCE4EC', '#F1F8E9', '#FFF3E0', '#F3E5F5', '#E0F7FA', '#FFFDE7'])
const connectionColorPresets = ref(['#666666', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B'])
const backgroundColorPresets = ref(['#FFFFFF', '#FAFAFA', '#F5F5F5', '#FFF8E1', '#E8F5E8', '#E3F2FD'])

// 节点形状选项
const nodeShapes = ref([
  { id: 'rectangle', name: '矩形', icon: 'heroicons:rectangle-stack' },
  { id: 'circle', name: '圆形', icon: 'heroicons:circle-stack' },
  { id: 'hexagon', name: '六边形', icon: 'heroicons:stop' },
  { id: 'diamond', name: '菱形', icon: 'heroicons:diamond' }
])

// 边框样式
const borderStyles = ref([
  { id: 'none', name: '无边框' },
  { id: 'solid', name: '实线' },
  { id: 'dashed', name: '虚线' },
  { id: 'dotted', name: '点线' },
  { id: 'double', name: '双线' }
])

// 背景图案
const backgroundPatterns = ref([
  { id: 'none', name: '无图案' },
  { id: 'grid', name: '网格' },
  { id: 'dots', name: '圆点' },
  { id: 'lines', name: '线条' },
  { id: 'traditional', name: '传统纹样' }
])

// 定制化设置
const customization = reactive({
  avatars: {
    size: 'medium',
    showAvatars: true,
    showNames: true,
    showDates: true,
    showTitles: false
  },
  spacing: {
    memberSpacing: 80,
    generationSpacing: 120,
    branchSpacing: 100,
    marginSize: 40
  },
  connections: {
    lineStyle: 'solid',
    lineWidth: 2,
    lineColor: '#666666',
    showArrows: false,
    connectionType: 'orthogonal'
  },
  decorations: {
    showBorders: true,
    borderStyle: 'solid',
    showShadows: true,
    shadowIntensity: 0.3,
    showGenerationLabels: true,
    showPatriarchCrown: true,
    backgroundPattern: 'none'
  }
})

// 预览数据
const previewMembers = ref([
  {
    id: 1,
    name: '叶德华',
    dates: '1920-1995',
    title: '始祖',
    gender: 'male',
    generation: 1,
    isPatriarch: true,
    deceased: true,
    avatar: '/mock-avatar-1.jpg'
  },
  {
    id: 2,
    name: '王秀英',
    dates: '1925-2000',
    title: '始祖母',
    gender: 'female',
    generation: 1,
    isPatriarch: false,
    deceased: true,
    avatar: '/mock-avatar-5.jpg'
  },
  {
    id: 3,
    name: '叶建国',
    dates: '1950-',
    title: '长子',
    gender: 'male',
    generation: 2,
    isPatriarch: false,
    deceased: false,
    avatar: '/mock-avatar-2.jpg'
  },
  {
    id: 4,
    name: '叶建华',
    dates: '1952-',
    title: '次子',
    gender: 'male',
    generation: 2,
    isPatriarch: false,
    deceased: false,
    avatar: '/mock-avatar-3.jpg'
  },
  {
    id: 5,
    name: '叶小明',
    dates: '1980-',
    title: '长孙',
    gender: 'male',
    generation: 3,
    isPatriarch: false,
    deceased: false,
    avatar: '/mock-avatar-4.jpg'
  },
  {
    id: 6,
    name: '叶小红',
    dates: '1985-',
    title: '孙女',
    gender: 'female',
    generation: 3,
    isPatriarch: false,
    deceased: false,
    avatar: '/mock-avatar-6.jpg'
  }
])

// 按世代分组的预览数据
const previewGenerations = computed(() => {
  const generations = {}
  previewMembers.value.forEach(member => {
    if (!generations[member.generation]) {
      generations[member.generation] = []
    }
    generations[member.generation].push(member)
  })

  return Object.keys(generations)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(gen => generations[gen])
})

// 分支预览数据
const previewBranches = computed(() => [
  {
    id: 1,
    head: previewMembers.value[2], // 叶建国
    members: [previewMembers.value[4], previewMembers.value[5]] // 叶小明, 叶小红
  },
  {
    id: 2,
    head: previewMembers.value[3], // 叶建华
    members: []
  }
])

// 宝塔层级预览数据
const previewPagodaLevels = computed(() => [
  [previewMembers.value[0]], // 第一层：始祖
  [previewMembers.value[2], previewMembers.value[3]], // 第二层：两个儿子
  [previewMembers.value[4], previewMembers.value[5]] // 第三层：孙辈
])

// 生命周期
onMounted(() => {
  loadCurrentLayout()
})

// 方法
const loadCurrentLayout = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/layout`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        selectedLayout.value = result.data.layout || 'european'
        Object.assign(customization, result.data.customization || customization)
      }
    }
  } catch (error) {
    console.error('加载当前布局失败:', error)
  }
}

const selectLayout = (layout) => {
  selectedLayout.value = layout.id
  applyLayoutPreset(layout.id)
}

const applyLayoutPreset = (layoutId) => {
  const presets = {
    european: {
      avatars: {
        size: 'medium',
        showAvatars: true,
        showNames: true,
        showDates: true
      },
      spacing: {
        memberSpacing: 100,
        generationSpacing: 120,
        branchSpacing: 80
      },
      connections: {
        lineStyle: 'solid',
        connectionType: 'orthogonal'
      }
    },
    suzhou: {
      avatars: {
        size: 'large',
        showAvatars: true,
        showNames: true,
        showDates: false
      },
      spacing: {
        memberSpacing: 80,
        generationSpacing: 150,
        branchSpacing: 120
      },
      connections: {
        lineStyle: 'solid',
        connectionType: 'straight'
      }
    },
    pagoda: {
      avatars: {
        size: 'small',
        showAvatars: true,
        showNames: true,
        showDates: false
      },
      spacing: {
        memberSpacing: 60,
        generationSpacing: 100,
        branchSpacing: 60
      },
      connections: {
        lineStyle: 'dashed',
        connectionType: 'curved'
      }
    },
    fan: {
      avatars: {
        size: 'medium',
        showAvatars: true,
        showNames: true,
        showDates: true
      },
      spacing: {
        memberSpacing: 90,
        generationSpacing: 110,
        branchSpacing: 90
      },
      connections: {
        lineStyle: 'solid',
        connectionType: 'radial'
      }
    },
    tree: {
      avatars: {
        size: 'medium',
        showAvatars: true,
        showNames: true,
        showDates: true
      },
      spacing: {
        memberSpacing: 80,
        generationSpacing: 120,
        branchSpacing: 100
      },
      connections: {
        lineStyle: 'solid',
        connectionType: 'tree'
      }
    },
    circular: {
      avatars: {
        size: 'small',
        showAvatars: true,
        showNames: true,
        showDates: false
      },
      spacing: {
        memberSpacing: 70,
        generationSpacing: 80,
        branchSpacing: 70
      },
      connections: {
        lineStyle: 'curved',
        connectionType: 'circular'
      }
    }
  }

  const preset = presets[layoutId]
  if (preset) {
    Object.assign(customization.avatars, preset.avatars)
    Object.assign(customization.spacing, preset.spacing)
    Object.assign(customization.connections, preset.connections)
  }
}

const resetCustomization = () => {
  applyLayoutPreset(selectedLayout.value)
}

const zoomIn = () => {
  previewZoom.value = Math.min(previewZoom.value * 1.2, 2)
}

const zoomOut = () => {
  previewZoom.value = Math.max(previewZoom.value / 1.2, 0.3)
}

const getPreviewMemberStyle = (member) => {
  const avatarSize = avatarSizes.value.find(s => s.id === customization.avatars.size)?.size || 48
  return {
    border: customization.decorations.showBorders ?
      `2px ${customization.decorations.borderStyle} #ddd` : 'none',
    boxShadow: customization.decorations.showShadows ?
      `0 2px 8px rgba(0,0,0,${customization.decorations.shadowIntensity})` : 'none',
    margin: `${customization.spacing.memberSpacing / 4}px`
  }
}

const getAvatarStyle = () => {
  const avatarSize = avatarSizes.value.find(s => s.id === customization.avatars.size)?.size || 48
  return {
    width: avatarSize + 'px',
    height: avatarSize + 'px'
  }
}

const getGenerationLabel = (generation) => {
  const labels = ['一世', '二世', '三世', '四世', '五世', '六世', '七世', '八世']
  return labels[generation - 1] || `${generation}世`
}

const getStrokeDashArray = () => {
  switch (customization.connections.lineStyle) {
    case 'dashed':
      return '5,5'
    case 'dotted':
      return '2,2'
    default:
      return 'none'
  }
}

const getPreviewConnections = () => {
  // 根据不同布局生成不同的连接线
  const connections = []

  if (selectedLayout.value === 'european') {
    // 欧式布局的连接线
    connections.push(
      { id: 1, path: 'M 150 80 L 250 80 L 250 150 L 200 150' },
      { id: 2, path: 'M 250 80 L 250 150 L 300 150' }
    )
  } else if (selectedLayout.value === 'suzhou') {
    // 苏式布局的连接线
    connections.push(
      { id: 1, path: 'M 200 100 L 200 200' },
      { id: 2, path: 'M 200 200 L 150 250' },
      { id: 3, path: 'M 200 200 L 250 250' }
    )
  } else if (selectedLayout.value === 'tree') {
    // 树形布局的连接线
    connections.push(
      { id: 1, path: 'M 200 100 Q 150 150 100 200' },
      { id: 2, path: 'M 200 100 Q 250 150 300 200' }
    )
  }

  return connections
}

const saveAsTemplate = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/layout-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        name: `${getCurrentLayoutName()}定制模板`,
        layout: selectedLayout.value,
        customization: customization
      })
    })

    if (response.ok) {
      appStore.showToast('模板已保存', 'success')
    }
  } catch (error) {
    console.error('保存模板失败:', error)
    appStore.showToast('保存失败', 'error')
  }
}

const applyLayout = async () => {
  isLoading.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/apply-layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        layout: selectedLayout.value,
        customization: customization
      })
    })

    if (response.ok) {
      appStore.showToast('布局已应用', 'success')
      router.push(`/genealogy/${genealogyId.value}`)
    }
  } catch (error) {
    console.error('应用布局失败:', error)
    appStore.showToast('应用失败', 'error')
  } finally {
    isLoading.value = false
  }
}

const getCurrentLayoutName = () => {
  const layout = genealogyLayouts.value.find(l => l.id === selectedLayout.value)
  return layout ? layout.name : '未知布局'
}
</script>

<style scoped>
.genealogy-layout-styles {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .guide-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
  border-radius: 8px;
}

.guide-btn {
  background: #f0f0f0;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 通用区域样式 */
.layout-selector,
.layout-customization,
.live-preview {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 布局选择器 */
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.current-layout {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 8px;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.layout-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.layout-card:hover {
  border-color: #07c160;
  background: #f9f9f9;
}

.layout-card.active {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.layout-preview {
  height: 140px;
  border-radius: 8px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.layout-preview.european {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.layout-preview.suzhou {
  background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%);
}

.layout-preview.pagoda {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}

.layout-preview.fan {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.layout-preview.tree {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
}

.layout-preview.circular {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.preview-content {
  height: 100%;
  padding: 8px;
  position: relative;
}

/* 欧式布局预览 */
.european-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.generation-row {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 苏式布局预览 */
.suzhou-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ancestor-section {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.descendants-section {
  display: flex;
  justify-content: space-around;
  flex: 1;
}

.branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sub-members {
  display: flex;
  gap: 4px;
}

/* 宝塔式布局预览 */
.pagoda-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
  justify-content: center;
}

.pagoda-level {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pagoda-level.level-1 {
  margin-bottom: 4px;
}

.pagoda-level.level-2 {
  margin-bottom: 4px;
}

/* 扇形布局预览 */
.fan-preview {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fan-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.fan-branches {
  position: relative;
  width: 80px;
  height: 80px;
}

.fan-branch {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  width: 30px;
}

/* 树形布局预览 */
.tree-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: space-between;
  padding: 8px 0;
}

.tree-trunk {
  display: flex;
  justify-content: center;
}

.tree-branches {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
}

/* 环形布局预览 */
.circular-preview {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.circle-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

/* 通用成员节点样式 */
.member-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 6px;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 40px;
}

.member-node.patriarch {
  border-color: #ffd700;
  background: #fffbf0;
}

.member-node.small {
  min-width: 24px;
  padding: 2px;
}

.member-node img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.member-node.small img {
  width: 16px;
  height: 16px;
}

.member-name {
  font-size: 8px;
  font-weight: 500;
  color: #333;
  text-align: center;
  line-height: 1;
}

.layout-info {
  margin-bottom: 12px;
}

.layout-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.layout-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.layout-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.feature-tag {
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 8px;
  font-size: 10px;
  color: #666;
}

.layout-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.popularity, .origin {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 风格定制 */
.customization-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.customization-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
}

.customization-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.tab-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.customization-content {
  min-height: 200px;
}

/* 定制化设置 */
.avatar-section h4,
.spacing-section h4,
.connection-section h4,
.decoration-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 头像设置 */
.avatar-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.size-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.size-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.size-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.size-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.avatar-preview {
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #ddd;
}

.avatar-preview.small {
  width: 24px;
  height: 24px;
}

.avatar-preview.medium {
  width: 32px;
  height: 32px;
}

.avatar-preview.large {
  width: 40px;
  height: 40px;
}

.avatar-preview.xlarge {
  width: 48px;
  height: 48px;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.display-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 间距设置 */
.spacing-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spacing-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spacing-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.spacing-group input[type="range"] {
  accent-color: #07c160;
}

.spacing-group span {
  font-size: 12px;
  color: #666;
}

/* 连线设置 */
.connection-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.connection-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.connection-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.connection-group input[type="range"] {
  accent-color: #07c160;
}

.connection-group input[type="color"] {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.connection-group span {
  font-size: 12px;
  color: #666;
}

/* 装饰设置 */
.decoration-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.decoration-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.decoration-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.sub-options {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-options select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.sub-options input[type="range"] {
  accent-color: #07c160;
}

.sub-options span {
  font-size: 11px;
  color: #666;
}

/* 字体定制 */
.font-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.font-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.font-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.font-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.font-group input[type="range"] {
  accent-color: #07c160;
}

.font-group span {
  font-size: 12px;
  color: #666;
}

/* 布局定制 */
.layout-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layout-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layout-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.shape-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.shape-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.shape-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.shape-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.layout-group input[type="range"] {
  accent-color: #07c160;
}

.layout-group span {
  font-size: 12px;
  color: #666;
}

.layout-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

/* 装饰定制 */
.decoration-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.decoration-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.decoration-group label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.border-options,
.pattern-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.border-btn,
.pattern-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.border-btn:hover,
.pattern-btn:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.border-btn.active,
.pattern-btn.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.border-preview,
.pattern-preview {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  background: #f0f0f0;
}

.border-preview.solid {
  border: 2px solid #333;
}

.border-preview.dashed {
  border: 2px dashed #333;
}

.border-preview.dotted {
  border: 2px dotted #333;
}

.border-preview.double {
  border: 3px double #333;
}

.pattern-preview.grid {
  background-image: linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px);
  background-size: 4px 4px;
}

.pattern-preview.dots {
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 4px 4px;
}

.pattern-preview.lines {
  background-image: repeating-linear-gradient(45deg, #ddd, #ddd 1px, transparent 1px, transparent 4px);
}

.shadow-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  accent-color: #07c160;
}

.shadow-controls {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shadow-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shadow-control label {
  min-width: 60px;
  font-size: 11px;
}

.shadow-control input[type="range"] {
  flex: 1;
  accent-color: #07c160;
}

.shadow-control span {
  min-width: 30px;
  font-size: 11px;
  color: #666;
}

.marker-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 实时预览 */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-level {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.preview-canvas {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  position: relative;
  transform-origin: center;
  transition: transform 0.2s;
}

.genealogy-preview {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 欧式布局 */
.european-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  height: 100%;
  justify-content: center;
}

.european-layout .generation-row {
  display: flex;
  justify-content: center;
  gap: 30px;
}

/* 苏式布局 */
.suzhou-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.suzhou-layout .ancestor-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.suzhou-layout .branches-section {
  display: flex;
  justify-content: space-around;
  flex: 1;
}

.family-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.branch-members {
  display: flex;
  gap: 8px;
}

/* 宝塔布局 */
.pagoda-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  height: 100%;
  justify-content: center;
  padding: 20px;
}

.pagoda-layout .pagoda-level {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 扇形布局 */
.fan-layout {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.fan-layout .fan-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.fan-layout .fan-branches {
  position: relative;
  width: 120px;
  height: 120px;
}

.fan-layout .fan-branch {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  width: 50px;
}

/* 树形布局 */
.tree-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: space-between;
  padding: 20px;
}

.tree-layout .tree-branches {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 30px;
}

/* 环形布局 */
.circular-layout {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.circular-layout .circle-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.circular-layout .circle-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

/* 预览成员样式 */
.preview-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
  min-width: 60px;
}

.preview-member:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.preview-member.patriarch {
  border-color: #ffd700;
  background: #fffbf0;
}

.preview-member.small {
  min-width: 40px;
  padding: 4px;
}

.member-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.generation-label {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #07c160;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
}

.member-avatar {
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #ddd;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-avatar.small {
  width: 24px;
  height: 24px;
}

.member-name {
  font-size: 10px;
  font-weight: 500;
  color: #333;
  text-align: center;
  line-height: 1.2;
}

.member-dates {
  font-size: 8px;
  color: #666;
  text-align: center;
}

.member-title {
  font-size: 8px;
  color: #999;
  text-align: center;
}

.patriarch-crown {
  position: absolute;
  top: -4px;
  left: -4px;
  color: #ffd700;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

/* 连接线 */
.preview-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.preview-connections path {
  transition: all 0.2s;
}

.preview-connections path.curved {
  stroke-linecap: round;
}

.preview-connections path.orthogonal {
  stroke-linecap: square;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 0 16px;
}

.save-template-btn, .apply-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-template-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.save-template-btn:hover {
  background: #e0e0e0;
}

.apply-btn {
  background: #07c160;
  color: white;
}

.apply-btn:hover {
  background: #06a552;
}

/* 风格指南弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.style-guide-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.guide-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.guide-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-description {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.guide-characteristics h5,
.guide-usage h5 {
  margin: 0 0 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.guide-characteristics ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #666;
}

.guide-characteristics li {
  margin-bottom: 4px;
}

.usage-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 2000;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  color: #07c160;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .style-grid {
    grid-template-columns: 1fr;
  }

  .color-options {
    grid-template-columns: 1fr;
  }

  .customization-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .shape-options,
  .border-options,
  .pattern-options {
    flex-wrap: wrap;
  }

  .preview-canvas {
    height: 200px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
