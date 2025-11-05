<template>
  <div class="home-container">
    <!-- 签到组件 -->
    <SignIn ref="signInRef" />
    <!-- 主体内容 -->
    <el-main class="main">
      <!-- 天气横幅 -->
      <div class="weather-banner" v-if="weatherInfo">
        <div class="weather-content">
          <span class="location">{{ weatherInfo.city }}</span>
          <span class="temperature">{{ weatherInfo.temperature }}°C</span>
          <span class="description">{{ weatherInfo.weather }}</span>
          <span class="humidity">湿度: {{ weatherInfo.humidity }}%</span>
        </div>
      </div>

      <div class="content-wrapper">
        <!-- 👇 新增：签到组件 -->
        <!-- 文章内容区域 -->
        <div class="articles-content">
          <div v-for="article in articles" :key="article.id" class="article-item">
            <h3 @click="goToDetail(article.title, article.id, article.filetype)" class="article-title">
              {{ article.title }}
            </h3>
            <p class="article-meta">
              作者: {{ userInfo.username }} |
              发布时间: {{ article.createTime }}
            </p>
            <p class="article-excerpt">
              {{ article.content?.substring(0, 100) }}...
            </p>
          </div>

          <!-- 分页 -->
          <el-pagination v-if="total > 0" class="pagination" :current-page="currentPage" :page-size="pageSize"
            :total="total" layout="prev, pager, next, total" @current-change="loadArticles" />
        </div>

        <!-- 右侧文章列表 -->
        <div class="sidebar">
          <div class="sign-in-trigger">
            <el-button type="primary" @click="openSignIn" size="large">
              🎁 每日签到
            </el-button>
          </div>
          <h3>最新文章</h3>
          <ul class="sidebar-article-list">
            <li v-for="article in articles" :key="article.id" @click="goToDetail(article.title, article.id, article.filetype)"
              class="sidebar-article-item">
              <div class="sidebar-article-title">{{ article.title }}</div>
              <div class="sidebar-article-meta">
                {{ article.createTime }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getArticles } from '@/api/article'
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
const articles = ref<Article[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

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
    const data = await getArticles(page, pageSize.value) as any
    articles.value = data.records
    total.value = data.total
    currentPage.value = page
  } catch (err) {
    // 错误已在拦截器中提示
  }
}

// 跳转详情
const goToDetail = (name: string, id: number | undefined, filetype: string | undefined) => {
  router.push({
    name: 'Documents',
    query: { name: name, id: id, filetype: filetype }
  })
}

// 获取天气数据
// 修改 getWeatherData 函数
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

// 页面加载
onMounted(async () => {
  if (isLogin) {
    await fetchProfile()
  }
  await loadArticles()
  getWeatherData('厦门')
})

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
</style>