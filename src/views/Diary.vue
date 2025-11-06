<!-- src/views/Diary.vue -->
<template>
    <div class="diary-container">
        <!-- 头部区域 -->
                <div class="header-wrapper">
                    <el-card class="diary-header" shadow="hover">
                        <div class="header-content">
                            <div class="header-left">
                                <h2 class="header-title">我的日记</h2>
                                <div class="header-subtitle">记录生活、沉淀思考。保持写作的习惯，留住每一个瞬间。</div>
                                <div class="header-stats">
                                    <span class="stat-item">共 <strong>{{ diaryEntries.length }}</strong> 篇</span>
                                    <span class="stat-sep">·</span>
                                    <span class="stat-item">最近：<strong>{{ lastEntryDate }}</strong></span>
                                </div>
                            </div>

                            <div class="header-right">
                                <el-input
                                    v-model="searchQuery"
                                    placeholder="搜索标题或内容"
                                    clearable
                                    size="small"
                                    prefix-icon="el-icon-search"
                                    class="search-input"
                                />

                                <el-select v-model="selectedTag" size="small" clearable placeholder="标签" class="tag-select">
                                    <el-option label="全部" value="全部" />
                                    <el-option v-for="tag in tagsList" :key="tag" :label="tag" :value="tag" />
                                </el-select>

                                <el-button class="mobile-panel-btn" type="text" icon="el-icon-menu" @click="drawerVisible = true" title="打开面板" />

                                <el-button 
                                    type="primary" 
                                    @click="openDiaryEditor()" 
                                    size="small"
                                    class="create-btn"
                                >
                                    <i class="el-icon-plus"></i> 写日记
                                </el-button>
                            </div>
                        </div>
                    </el-card>
                </div>

        <!-- 内容布局：左侧面板 + 右侧时间线 -->
        <div class="content-layout">
            <aside class="left-panel">
                <div class="panel-card">
                    <div class="avatar"> 
                        <i class="el-icon-user"></i>
                    </div>
                    <div class="panel-info">
                        <div class="panel-name">我的日记本</div>
                        <div class="panel-desc">整理你的想法与生活片段</div>
                    </div>
                </div>

                <div class="panel-section">
                    <div class="panel-section-title">归档</div>
                    <div class="archive-list">
                        <div class="archive-item" :key="a.key" v-for="a in archiveList">
                            <a @click.prevent="selectMonth(a.key)" :class="{ active: selectedMonth === a.key }">{{ a.label }}</a>
                            <span class="count">{{ a.count }}</span>
                        </div>
                        <div v-if="archiveList.length === 0" class="empty-archive">暂无归档</div>
                    </div>
                </div>

                <div class="panel-section">
                    <div class="panel-section-title">标签</div>
                    <div class="tag-list">
                        <el-tag 
                            :key="'全部'" 
                            type="info" 
                            :closable="false" 
                            @click="selectedTag = '全部'"
                            :effect="selectedTag === '全部' ? 'dark' : 'plain'"
                        >全部</el-tag>
                        <el-tag v-for="tag in tagsList" :key="tag" class="tag-chip" @click="selectTag(tag)" :type="selectedTag === tag ? 'success' : undefined">{{ tag }}</el-tag>
                    </div>
                    <el-button type="text" size="small" @click="selectedTag = '全部'">清除标签筛选</el-button>
                </div>

                <div class="panel-section">
                    <div class="panel-section-title">快捷操作</div>
                    <el-button type="primary" size="small" @click="openDiaryEditor()">写日记</el-button>
                    <el-button type="text" size="small" @click="selectMonth(); selectedTag = '全部'">清除所有筛选</el-button>
                </div>
            </aside>

            <!-- 移动端抽屉：同样内容，供小屏幕使用 -->
            <el-drawer v-model:visible="drawerVisible" direction="ltr" size="280px" with-header="false">
                <div class="drawer-content">
                    <div class="panel-card">
                        <div class="avatar"> 
                            <i class="el-icon-user"></i>
                        </div>
                        <div class="panel-info">
                            <div class="panel-name">我的日记本</div>
                            <div class="panel-desc">整理你的想法与生活片段</div>
                        </div>
                    </div>

                    <div class="panel-section">
                        <div class="panel-section-title">归档</div>
                        <div class="archive-list">
                            <div class="archive-item" :key="a.key" v-for="a in archiveList">
                                <a @click.prevent="selectMonth(a.key)">{{ a.label }} <span class="count">{{ a.count }}</span></a>
                            </div>
                            <div v-if="archiveList.length === 0" class="empty-archive">暂无归档</div>
                        </div>
                    </div>

                    <div class="panel-section">
                        <div class="panel-section-title">标签</div>
                        <div class="tag-list">
                            <el-tag 
                                :key="'全部'" 
                                type="info" 
                                :closable="false" 
                                @click="selectedTag = '全部'; drawerVisible = false"
                            >全部</el-tag>
                            <el-tag v-for="tag in tagsList" :key="tag" class="tag-chip" @click="selectTag(tag); drawerVisible = false">{{ tag }}</el-tag>
                        </div>
                    </div>

                    <div class="panel-section">
                        <el-button type="primary" size="small" @click="openDiaryEditor(); drawerVisible=false">写日记</el-button>
                        <el-button type="text" size="small" @click="selectMonth(); selectedTag = '全部'; drawerVisible=false">清除筛选</el-button>
                    </div>
                </div>
            </el-drawer>

            <!-- 时间线展示 -->
            <div class="right-panel">
                <div class="timeline-container">
            <div v-if="diaryEntries.length === 0" class="empty-state">
                <i class="el-icon-notebook-1" style="font-size: 64px; color: #ddd;"></i>
                <p class="empty-text">暂无日记记录</p>
                <el-button type="primary" @click="openDiaryEditor()">开始写第一篇日记</el-button>
                </div>
            </div>
        </div>

                <div v-for="entry in filteredEntries" :key="entry.id" class="timeline-item">
                    <!-- 每项的小时间圆点（含月/日） -->
                    <div class="timeline-dot">
                        <div class="dot-inner">{{ formatMonthDay(entry.createTime) }}</div>
                    </div>

                    <!-- 日记卡片 -->
                    <el-card 
                        class="diary-entry-card" 
                        @click="openDiaryEditor(entry)"
                        :class="{ 'has-image': entry.coverImage }"
                        shadow="hover"
                    >         
                        <!-- 内容区域 -->
                        <div class="entry-content">
                            <div class="entry-header">
                                <h3 class="entry-title">{{ entry.title }}</h3>
                                <div class="entry-meta">
                                    <span class="entry-date">{{ formatDate(entry.createTime) }}</span>
                                    <span class="entry-tag" v-if="entry.tags && entry.tags.length > 0">
                                        {{ entry.tags.join(', ') }}
                                    </span>
                                </div>
                            </div>
                        
                            <p class="entry-preview" v-if="entry.content">
                                {{ entry.content }}
                            </p>
                        
                            <div class="entry-footer">
                                <span class="entry-word-count">{{ entry.content?.length || 0 }}字</span>
                                <span class="entry-read-time">阅读约{{ Math.ceil((entry.content?.length || 0) / 300) }}分钟</span>
                            </div>
                        </div>
                    </el-card>
                </div>
        </div>

        <!-- 日记编辑器弹窗 -->
        <el-dialog 
            v-model="editorVisible" 
            title="日记编辑" 
            width="80%"
            :close-on-click-modal="false"
            :before-close="handleClose"
            class="diary-editor-dialog"
        >
            <DiaryEditor 
                v-if="editorVisible" 
                :diary-entry="currentEntry" 
                @save="saveDiaryEntry"
                @close="editorVisible = false" 
            />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DiaryEditor from '../components/DiaryEditor.vue'
import { getArticles as getDiaryEntries, createArticle } from '@/api/article'
import type { Article } from '@/types/article'

// DiaryEntry 扩展：允许有封面和标签字段（部分日记可能没有）
type DiaryEntry = Article & { coverImage?: string; tags?: string[] }
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'
import { ElMessageBox } from 'element-plus'

// 数据状态
const diaryEntries = ref<DiaryEntry[]>([])
const editorVisible = ref(false)
const currentEntry = ref<DiaryEntry | null>(null)
const searchQuery = ref('')
const selectedTag = ref<string | null>('全部')
const tagsList = ref<string[]>([])
const selectedMonth = ref<string | null>(null)
const drawerVisible = ref(false)

const filteredEntries = computed(() => {
    const q = (searchQuery.value || '').trim().toLowerCase()
    return diaryEntries.value.filter(e => {
        // 标签过滤
        if (selectedTag.value && selectedTag.value !== '全部') {
            if (!e.tags || !e.tags.includes(selectedTag.value)) return false
        }
        // 月份过滤（格式：YYYY-MM）
        if (selectedMonth.value) {
            const ct = e.createTime ? new Date(e.createTime) : null
            const key = ct ? `${ct.getFullYear()}-${String(ct.getMonth() + 1).padStart(2, '0')}` : null
            if (key !== selectedMonth.value) return false
        }
        // 关键词搜索（标题或内容）
        if (q) {
            const inTitle = e.title?.toLowerCase().includes(q)
            const inContent = e.content?.toLowerCase().includes(q)
            return Boolean(inTitle || inContent)
        }
        return true
    })
})

const lastEntryDate = computed(() => {
    if (!diaryEntries.value || diaryEntries.value.length === 0) return '—'
    const sorted = [...diaryEntries.value].sort((a, b) => {
        const ta = a.createTime ? new Date(a.createTime).getTime() : 0
        const tb = b.createTime ? new Date(b.createTime).getTime() : 0
        return tb - ta
    })
    return formatDate(sorted[0].createTime)
})

const selectTag = (tag?: string) => {
    selectedTag.value = tag || '全部'
}

// 月份归档：返回数组 [{ key: '2025-11', label: '2025年11月', count: 3 }]
const archiveList = computed(() => {
    const map = new Map<string, number>()
    diaryEntries.value.forEach(e => {
        if (!e.createTime) return
        const d = new Date(e.createTime)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        map.set(key, (map.get(key) || 0) + 1)
    })
    const arr = Array.from(map.entries()).map(([k, v]) => {
        const [y, m] = k.split('-')
        return { key: k, label: `${y}年${Number(m)}月`, count: v }
    })
    // 按时间降序
    return arr.sort((a, b) => b.key.localeCompare(a.key))
})

const selectMonth = (monthKey?: string) => {
    selectedMonth.value = monthKey || null
    drawerVisible.value = false // 点击后自动关闭抽屉（移动端）
}

// 获取日记列表
const loadDiaryEntries = async () => {
    try {
        const data = await getDiaryEntries() as any
        diaryEntries.value = data.records.filter((entry: Article) => entry.filetype === 'diary') as DiaryEntry[]
        // 提取标签列表
        const s = new Set<string>()
        diaryEntries.value.forEach(e => e.tags?.forEach(t => s.add(t)))
        tagsList.value = Array.from(s)
    } catch (error) {
        console.error('获取日记列表失败:', error)
    }
}

// 打开日记编辑器
const openDiaryEditor = (entry?: DiaryEntry) => {
    currentEntry.value = entry || null
    editorVisible.value = true
}

// 保存日记
const saveDiaryEntry = async (entry: DiaryEntry) => {
    try {
        entry.filetype = 'diary' // 设置文件类型为日记
        entry.userId = LocalStorageUtil.get('userId')
        await createArticle(entry)
        editorVisible.value = false
        loadDiaryEntries() // 重新加载列表
    } catch (error) {
        console.error('保存日记失败:', error)
    }
}

// 格式化日期
const formatDate = (date: string | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    })
}

// 用于模板中显示月/日的简短格式（例如：11月6日）
const formatMonthDay = (date: string | undefined) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 关闭对话框前的处理
const handleClose = (done: Function) => {
    if (currentEntry.value && currentEntry.value.id) {
        // 如果是编辑模式，确认是否保存修改
        ElMessageBox.confirm('确定要放弃修改吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            done()
        }).catch(() => {
            // 取消关闭
        })
    } else {
        done()
    }
}

onMounted(() => {
    loadDiaryEntries()
})
</script>

<style scoped>
.diary-container {
    padding: 20px;
    background-color: #f8f9fa;
    min-height: 100vh;
}

.header-wrapper {
    margin-bottom: 20px;
}

.diary-header {
    border-radius: 12px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.header-subtitle {
    color: rgba(255,255,255,0.9);
    font-size: 13px;
    opacity: 0.95;
}

.header-stats {
    color: rgba(255,255,255,0.9);
    font-size: 13px;
    margin-top: 4px;
}

.header-right {
    display: flex;
    gap: 10px;
    align-items: center;
}

.search-input {
    width: 220px;
}

.tag-select {
    min-width: 140px;
}

.content-layout {
    max-width: 1100px;
    margin: 18px auto 0 auto;
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.left-panel {
    width: 220px;
}

.panel-card {
    background: linear-gradient(135deg, #fbfbff, #f3f6ff);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    gap: 12px;
    align-items: center;
    box-shadow: 0 4px 12px rgba(102,126,234,0.06);
    margin-bottom: 12px;
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg,#667eea,#764ba2);
    display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;
}

.panel-name{font-weight:700}
.panel-desc{font-size:12px;color:#666}

.panel-section{background:#fff;border-radius:8px;padding:10px;margin-bottom:12px}
.panel-section-title{font-weight:600;margin-bottom:8px}
.tag-list{display:flex;flex-wrap:wrap;gap:8px}

.right-panel{flex:1}

.archive-list{display:flex;flex-direction:column;gap:6px}
.archive-item{display:flex;justify-content:space-between;align-items:center}
.archive-item a{color:#58677b;cursor:pointer}
.archive-item a.active{font-weight:700;color:#2b6cff}
.archive-item .count{color:#999;font-size:12px}

.mobile-panel-btn{display:none}

/* 隐藏左侧面板在移动端，显示抽屉触发按钮 */
@media (max-width: 768px) {
    .left-panel{display:none}
    .content-layout{padding:0 12px}
    .header-right .search-input{display:none}
    .header-right .tag-select{display:none}
    .mobile-panel-btn{display:inline-flex}
}

/* 头部卡片与右侧面板对齐：限制最大宽度并居中 */
.diary-header{
    max-width:1100px;
    margin:0 auto;
}
.header-content{max-width:1100px;margin:0 auto;}

.header-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: white;
}

.create-btn {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.create-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.timeline-container {
    position: relative;
    padding-left: 72px; /* 给时间轴和小圆点留出空间 */
}

.timeline-marker {
    position: absolute;
    left: 40px;
    top: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #e6eefc, #eef3ff);
    border-radius: 2px;
    z-index: 1;
}

.timeline-item {
    margin-bottom: 24px;
    position: relative;
    width: 100%;
}

.timeline-dot {
    position: absolute;
    left: 24px;
    top: 18px;
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    z-index: 3;
    box-shadow: 0 4px 12px rgba(102,126,234,0.18);
    font-size: 12px;
}

.timeline-dot .dot-inner {
    font-weight: 700;
}

.diary-entry-card {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid #ebeef5;
    margin-left: 20px;
    padding: 0;
    min-width: 300px;
}

.diary-entry-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.diary-entry-card.has-image {
    border-radius: 12px;
}

.entry-cover {
    width: 100%;
    height: 150px;
    overflow: hidden;
    background-color: #f5f5f5;
}

.entry-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.entry-cover img:hover {
    transform: scale(1.05);
}

.entry-cover.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7ff, #eef3ff);
    color: #6c7aa6;
}

.entry-cover.placeholder .placeholder-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.entry-cover.placeholder i {
    font-size: 28px;
    color: #9aa8e6;
}

.placeholder-title {
    font-size: 13px;
    color: #6573b5;
    font-weight: 600;
    max-width: 90%;
    text-align: center;
}

.entry-content {
    padding: 18px 20px;
}

.entry-header {
    margin-bottom: 12px;
}

.entry-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    transition: color 0.3s ease;
}

.entry-title:hover {
    color: #667eea;
}

.entry-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}

.entry-date {
    font-weight: 500;
}

.entry-tag {
    background-color: #e6f7ff;
    color: #1890ff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}

.entry-preview {
    color: #666;
    line-height: 1.6;
    margin-bottom: 12px;
    font-size: 14px;
    text-align: justify;
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.entry-footer {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #999;
    padding-top: 12px;
    border-top: 1px dashed #eee;
}

.entry-word-count,
.entry-read-time {
    font-size: 12px;
    color: #999;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
}

.empty-state i {
    margin-bottom: 20px;
}

.empty-text {
    font-size: 16px;
    margin-bottom: 20px;
}

.diary-editor-dialog {
    .el-dialog__body {
        padding: 20px;
    }
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .timeline-item {
        width: calc(50% - 20px);
    }
}

@media (max-width: 768px) {
    .diary-container {
        padding: 10px;
    }
    
    .header-wrapper {
        margin-bottom: 10px;
    }
    
    .diary-header {
        padding: 15px;
    }
    
    .header-title {
        font-size: 20px;
    }
    
    .timeline-container {
        padding-left: 44px;
    }
    
    .timeline-marker {
        left: 22px;
    }
    
    .timeline-item {
        width: 100%;
    }
    
    .diary-entry-card {
        margin-left: 0;
    }
    
    .entry-preview {
        font-size: 13px;
    }
}
</style>