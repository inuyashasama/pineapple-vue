<template>
  <div class="home-container">
    <!-- 签到组件 -->
    <SignIn ref="signInRef" />

    <el-main class="main">
      <!-- 顶部：天气横幅 + 搜索/筛选 -->
      <div class="top-bar">
        <div class="top-right">
          <el-input v-model="searchQuery" placeholder="搜索文章标题或内容" clearable size="small" class="home-search"
            @clear="onSearchClear" @keyup.enter.native="loadArticles(1)">
            <template #prefix>
              <i class="el-icon-search"></i>
            </template>
          </el-input>

          <el-select v-model="selectedTag" size="small" clearable placeholder="筛选标签" class="home-select"
            @change="() => loadArticles(1)">
            <el-option label="全部" value="全部" />
            <el-option v-for="tag in tagsList" :key="tag" :label="tag" :value="tag" />
          </el-select>

          <el-select v-model="selectedCategory" size="small" clearable placeholder="分类" @change="() => loadArticles(1)">
            <el-option label="全部" value="全部" />
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
          <el-button class="mobile-filter-btn" icon="el-icon-menu" type="text" @click="drawerVisible = true"
            title="筛选" />
        </div>
      </div>

      <!-- 主体两栏：左主内容，右侧栏 -->
      <div class="content-layout">
        <section class="main-content">
          <!-- Hero / Featured -->
          <div class="hero" v-if="featuredArticle">
            <div class="hero-cover"
              @click="goToDetail(featuredArticle.title, featuredArticle.id, featuredArticle.filetype)">
              <div class="hero-overlay">
                <h2 class="hero-title">{{ featuredArticle.title }}</h2>
                <p class="hero-meta">作者: {{ userInfo.username }} · {{ formatDate(featuredArticle.createTime) }}</p>
              </div>
            </div>
            <p class="hero-excerpt">{{ featuredArticle.content?.substring(0, 200) }}...</p>
            <div class="hero-actions">
              <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="onCoverSelected" />
              <el-button size="small" type="primary" @click="openCoverInput">上传封面</el-button>
              <el-button size="small" @click="removeFeaturedCover">移除封面</el-button>
            </div>
          </div>

          <!-- 文章网格 -->
          <div class="articles-grid">
            <div v-for="article in pagedArticles" :key="article.id" class="article-card">
              <div class="card-cover" v-if="article.imageUrl"
                @click="goToDetail(article.title, article.id, article.filetype)">
                <img :src="article.imageUrl" alt="cover" />
              </div>
              <div class="card-body" @click="goToDetail(article.title, article.id, article.filetype)">
                <h4 class="card-title">{{ article.title }}</h4>
                <div class="card-meta">{{ formatDate(article.createTime) }} · {{ article.views || 0 }} 阅读</div>
                <p class="card-excerpt">{{ article.content?.substring(0, 120) }}...</p>
                <div class="card-tags">
                  <el-tag v-for="t in (article.tags || [])" :key="t" size="mini" @click.stop="selectTagAndLoad(t)">{{ t
                    }}</el-tag>
                </div>
                <!-- 添加删除按钮 -->
                <div class="card-actions">
                  <el-button v-if="isLogin" size="small" type="danger" @click.stop="handleDelete(article.id)">
                    删 除
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <el-pagination v-if="total > 0" class="pagination" :current-page="currentPage" :page-size="pageSize"
            :total="total" layout="prev, pager, next, total" @current-change="loadArticles" />
        </section>

        <aside class="right-panel">
          <div class="panel-card sign-panel">
            <SignIn ref="signInRef" />
            <el-button type="primary" @click="openSignIn" size="small">每日签到</el-button>
          </div>

          <div class="panel-card">
            <h4>标签云</h4>
            <div class="tag-cloud">
              <el-tag v-for="tag in tagsList" :key="tag" class="tag-cloud-item" @click="selectedTag = tag">{{ tag
                }}</el-tag>
              <el-tag v-if="tagsList.length === 0" type="info">暂无标签</el-tag>
            </div>
          </div>

          <div class="panel-card">
            <h4>热门文章</h4>
            <ul class="popular-list">
              <li v-for="p in popularArticles" :key="p.id" @click="goToDetail(p.title, p.id, p.filetype)">
                <div class="pop-title">{{ p.title }}</div>
                <div class="pop-meta">{{ formatDate(p.createTime) }} · {{ p.views || 0 }}</div>
              </li>
            </ul>
          </div>

          <div class="panel-card">
            <h4>阅读统计（TOP 5）</h4>
            <div class="mini-stats">
              <div v-for="p in popularArticles.slice(0, 5)" :key="p.id" class="stat-row">
                <div class="stat-label">{{ p.title }}</div>
                <div class="stat-bar-wrap">
                  <div class="stat-bar"
                    :style="{ width: Math.min(100, (p.views || 0) / (popularArticles[0]?.views || 1) * 100) + '%' }">
                  </div>
                </div>
                <div class="stat-value">{{ p.views || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="panel-card weather-small" v-if="weatherInfo">
            <h4>当前天气</h4>
            <div>{{ weatherInfo.city }} · {{ weatherInfo.temperature }}°C · {{ weatherInfo.weather }}</div>
          </div>
        </aside>
      </div>
    </el-main>
    <!-- 移动端筛选抽屉 -->
    <el-drawer v-model:visible="drawerVisible" direction="rtl" size="320px" with-header="false">
      <div class="drawer-panel">
        <div class="drawer-section">
          <h4>搜索</h4>
          <el-input v-model="searchQuery" placeholder="搜索文章标题或内容" clearable @clear="onSearchClear"
            @keyup.enter.native="loadArticles(1)"></el-input>
          <el-button type="primary" @click="loadArticles(1)" style="margin-top:8px">应用</el-button>
        </div>
        <div class="drawer-section">
          <h4>标签</h4>
          <div class="tag-cloud">
            <el-tag v-for="tag in tagsList" :key="tag" @click="selectTagAndLoad(tag)">{{ tag }}</el-tag>
          </div>
        </div>
        <div class="drawer-section">
          <h4>分类</h4>
          <el-select v-model="selectedCategory" clearable @change="() => loadArticles(1)">
            <el-option label="全部" value="全部" />
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getArticles,deleteArticle } from '@/api/article'
import { Article } from '@/types/article'
import SignIn from '@/components/SignIn.vue'
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'
import { WeatherInfo } from '@/types/weather'

// 添加天气数据状态
const weatherInfo = ref<WeatherInfo | null>(null)
const loadingWeather = ref(false)

// 路由
const router = useRouter()
// 登录状态
const isLogin = !!LocalStorageUtil.get('token')
const userInfo = ref<{ username: string }>({ username: '用户' })

// 文章列表
type HomeArticle = Article & { coverImage?: string; tags?: string[] }
const articles = ref<HomeArticle[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 新增：搜索与筛选
const searchQuery = ref('')
const selectedTag = ref<string | null>('全部')
const selectedCategory = ref<string | null>('全部')

// 从 articles 中派生的标签/分类/推荐
const tagsList = computed(() => {
  const s = new Set<string>()
  articles.value.forEach(a => (a as any).tags?.forEach((t: string) => s.add(t)))
  return Array.from(s)
})

const categories = computed(() => {
  // 临时使用 filetype 作为分类示例
  const s = new Set<string>()
  articles.value.forEach(a => { if (a.filetype) s.add(a.filetype) })
  return Array.from(s)
})

const featuredArticle = computed(() => articles.value.length ? articles.value[0] : null)

const filteredArticles = computed(() => {
  const q = (searchQuery.value || '').toLowerCase().trim()
  return articles.value.filter(a => {
    if (selectedTag.value && selectedTag.value !== '全部') {
      const tags = (a as any).tags || []
      if (!tags.includes(selectedTag.value)) return false
    }
    if (selectedCategory.value && selectedCategory.value !== '全部') {
      if (a.filetype !== selectedCategory.value) return false
    }
    if (q) {
      return (a.title || '').toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q)
    }
    return true
  })
})

// 分页展示：当前依然基于后端分页，这里对当前页内数据再做过滤
const pagedArticles = computed(() => filteredArticles.value)

const popularArticles = computed(() => {
  return [...articles.value].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6)
})

// Mobile drawer for filters
const drawerVisible = ref(false)

// Cover upload handling (client-side resize and set as base64)
const onCoverSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    const dataUrl = reader.result as string
    // 简单裁剪/缩放：绘制到 canvas，输出固定宽高比例 (1200x400)
    const img = new Image()
    img.onload = () => {
      const w = 1200
      const h = 400
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      // cover crop: scale and center
      const ratio = Math.max(w / img.width, h / img.height)
      const sw = w / ratio
      const sh = h / ratio
      const sx = (img.width - sw) / 2
      const sy = (img.height - sh) / 2
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
      const out = canvas.toDataURL('image/jpeg', 0.85)
      // set to first article (featured)
      if (articles.value.length > 0) {
        articles.value[0].coverImage = out
      }
    }
    img.src = dataUrl
  }
}

const removeFeaturedCover = () => {
  if (articles.value.length > 0) {
    delete articles.value[0].coverImage
  }
}

const selectTagAndLoad = (tag: string) => {
  selectedTag.value = tag
  loadArticles(1)
}

const coverInput = ref<HTMLInputElement | null>(null)
const openCoverInput = () => {
  coverInput.value?.click()
}

// 获取用户信息（可后续优化到 Pinia）
const fetchProfile = async () => {
  // 这里先简单处理，后续可调用 getProfile()
  const token = LocalStorageUtil.get('token')
  if (token) {
    userInfo.value.username = LocalStorageUtil.get('username') || '用户'
  }
}

// 加载文章列表
const loadArticles = async (page = 1) => {
  try {
    // 服务端分页与筛选：传递搜索关键词、标签、分类
    const params: Record<string, any> = {}
    if (searchQuery.value) params.q = searchQuery.value
    if (selectedTag.value && selectedTag.value !== '全部') params.tag = selectedTag.value
    if (selectedCategory.value && selectedCategory.value !== '全部') params.category = selectedCategory.value

    const data = await getArticles(page, pageSize.value, params) as any
    articles.value = data.records
    total.value = data.total
    currentPage.value = page
  } catch (err) {
    // 错误已在拦截器中提示
  }
}

const onSearchClear = () => {
  searchQuery.value = ''
}

const formatDate = (date: string | undefined) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

// 跳转详情
const goToDetail = (name: string, id: number | undefined, filetype: string | undefined) => {
  if (filetype === 'diary') {
    router.push({
      name: 'Diary',
    })
    return
  }
  router.push({
    name: 'Documents',
    query: { name: name, id: id, filetype: filetype }
  })
}

// 获取天气数据
const getWeatherData = async (city: string) => {
  loadingWeather.value = true
  try {
    city = city || '厦门'

    // 检查缓存
    const cacheKey = `weather_${city}`
    const cachedData = LocalStorageUtil.get(cacheKey)
    const cacheTime = LocalStorageUtil.get(`${cacheKey}_time`)

    // 如果缓存存在且未过期（1小时）
    if (cachedData && cacheTime) {
      const now = new Date().getTime()
      const cacheAge = now - parseInt(cacheTime)
      // 缓存有效期1小时
      if (cacheAge < 60 * 60 * 1000) {
        weatherInfo.value = cachedData
        return
      }
    }

    // 缓存不存在或已过期，重新请求
    const apiKey = 'eae0c155eabe9e73dd59b5dae8a1c4bb'
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${apiKey}&city=${city}`
    const response = await fetch(url)
    const data: any = await response.json()

    if (data.status === '1' && data.lives && data.lives.length > 0) {
      weatherInfo.value = data.lives[0]
      // 保存到缓存
      LocalStorageUtil.set(cacheKey, data.lives[0])
      LocalStorageUtil.set(`${cacheKey}_time`, new Date().getTime().toString())
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
  } finally {
    loadingWeather.value = false
  }
}

// 添加删除文章函数
const handleDelete = async (id: number | undefined) => {
  try {
    if (!id) return
    // 调用删除 API
    await deleteArticle(id)
    // 重新加载文章列表
    loadArticles(currentPage.value)
  } catch (error) {
    console.error('删除文章失败:', error)
  }
}


// 页面加载
onMounted(async () => {
  if (isLogin) {
    await fetchProfile()
  }
  await loadArticles()
  getWeatherData('厦门')
})

// 移动端抽屉：在 template 末尾加入 el-drawer
// （使用 ref drawerVisible）

// 获取子组件实例
const signInRef = ref<InstanceType<typeof SignIn> | null>(null)

// 打开签到弹窗
const openSignIn = () => {
  if (signInRef.value) {
    signInRef.value.open()
  }
}
</script>

<style scoped>
.card-actions {
  display: flex;
  margin-bottom: 5px;
  justify-content: flex-end;
  margin-top: auto
}

.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.sign-in-trigger {
  text-align: center;
  padding: 20px 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  margin: 0 auto;
  border-radius: 8px;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.logo {
  font-size: 1.5em;
  font-weight: bold;
  color: #ff6f61;
}

.nav-right .user-dropdown {
  cursor: pointer;
  color: #666;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.content-wrapper {
  display: flex;
  gap: 20px;
}

.articles-content {
  flex: 3;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.sidebar {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  align-self: flex-start;
}

.sidebar-article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-article-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.sidebar-article-item:last-child {
  border-bottom: none;
}

.sidebar-article-title {
  font-size: 0.95em;
  color: #333;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-article-meta {
  font-size: 0.8em;
  color: #999;
}

.article-item {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.article-item:last-child {
  border-bottom: none;
}

.article-item:hover {
  transform: translateY(-2px);
}

.article-title {
  font-size: 1.4em;
  color: #333;
  margin: 0 0 10px;
  cursor: pointer;
}

.article-title:hover {
  color: #ff6f61;
}

.article-meta {
  color: #999;
  font-size: 0.9em;
  margin: 0 0 10px;
}

.article-excerpt {
  color: #666;
  line-height: 1.6;
}

.pagination {
  text-align: center;
  margin: 30px 0;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
}

/* 天气模块样式 */
.weather-banner {
  background: linear-gradient(90deg, #00b4db, #0083b0);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weather-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.weather-content .location {
  font-weight: bold;
  font-size: 1.1em;
}

.weather-content .temperature {
  font-weight: bold;
  font-size: 1.3em;
}

.weather-content .description {
  font-size: 1em;
}

.weather-content .humidity {
  font-size: 0.9em;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .weather-content {
    justify-content: space-between;
  }

  .weather-content .temperature {
    font-size: 1.1em;
  }
}

/* 新增样式 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px
}

.top-right {
  display: flex;
  align-items: center;
  gap: 10px
}

.home-search {
  width: 300px
}

.home-select {
  min-width: 140px
}

.mobile-filter-btn {
  display: none
}

.content-layout {
  display: flex;
  gap: 20px
}

.main-content {
  flex: 3
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px
}

.hero {
  background: linear-gradient(180deg, #fff, #fbfdff);
  padding: 18px;
  border-radius: 10px;
  margin-bottom: 16px;
  position: relative
}

.hero-cover {
  height: 220px;
  background: #dfefff;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  cursor: pointer
}

.hero-overlay {
  padding: 16px;
  color: #123
}

.hero-title {
  margin: 0;
  color: #123;
  font-size: 22px
}

.hero-excerpt {
  margin-top: 10px;
  color: #666
}

.hero-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px
}

.article-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  display: flex; 
  flex-direction: column; 
  height: 100%
}

.card-cover img {
  width: 100%;
  height: 140px;
  object-fit: cover
}

.card-body {
  padding: 12px;
  display: flex; 
  flex-direction: column; 
  flex: 1
}

.card-title {
  margin: 0 0 8px
}

.card-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px
}

.card-excerpt {
  color: #666;
  font-size: 14px
}

.card-tags {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap
}

.tag-cloud-item {
  cursor: pointer;
  margin: 6px 6px 0 0
}

.popular-list {
  list-style: none;
  padding: 0;
  margin: 0
}

.popular-list li {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  cursor: pointer
}

.popular-list li:last-child {
  border-bottom: none
}

.mini-stats .stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px
}

.stat-label {
  flex: 1;
  font-size: 13px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis
}

.stat-bar-wrap {
  width: 120px;
  background: #f0f3ff;
  height: 8px;
  border-radius: 4px;
  overflow: hidden
}

.stat-bar {
  height: 8px;
  background: linear-gradient(90deg, #6b8cff, #3b6bff)
}

.stat-value {
  width: 40px;
  text-align: right;
  color: #666;
  font-size: 12px
}

.drawer-panel {
  padding: 16px
}

.drawer-section {
  margin-bottom: 12px
}

@media (max-width: 768px) {
  .home-search {
    display: none
  }

  .home-select {
    display: none
  }

  .mobile-filter-btn {
    display: inline-flex
  }

  .content-layout {
    flex-direction: column
  }

  .top-right {
    gap: 6px
  }
}
</style>