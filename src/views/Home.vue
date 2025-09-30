<template>
  <div class="home-container">
    <!-- 主体内容 -->
    <el-main class="main">
      <div class="content-wrapper">
        <!-- 文章内容区域 -->
        <div class="articles-content">
          <h2>文章列表</h2>
          <div v-for="article in articles" :key="article.id" class="article-item">
            <h3 @click="goToDetail(article.name)" class="article-title">
              {{ article.name }}
            </h3>
            <p class="article-meta">
              作者: {{ article.userId }} | 
              发布时间: {{ article.createTime }}
            </p>
            <p class="article-excerpt">
              {{ article.content?.substring(0, 100) }}...
            </p>
          </div>
          
          <!-- 分页 -->
          <el-pagination
            v-if="total > 0"
            class="pagination"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next, total"
            @current-change="loadArticles"
          />
        </div>
        
        <!-- 右侧文章列表 -->
        <div class="sidebar">
          <h3>最新文章</h3>
          <ul class="sidebar-article-list">
            <li 
              v-for="article in articles" 
              :key="article.id" 
              @click="goToDetail(article.name)"
              class="sidebar-article-item"
            >
              <div class="sidebar-article-title">{{ article.name }}</div>
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
import { getArticles } from '@/api/markdown'
import { Article } from '@/types/article'

// 路由
const router = useRouter()

// 登录状态
const isLogin = !!localStorage.getItem('token')
const userInfo = ref<{ username: string }>({ username: '用户' })

// 文章列表
const articles = ref<Article[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 获取用户信息（可后续优化到 Pinia）
const fetchProfile = async () => {
  // 这里先简单处理，后续可调用 getProfile()
  const token = localStorage.getItem('token')
  if (token) {
    userInfo.value.username = localStorage.getItem('username') || '用户'
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
const goToDetail = (name: string) => {
    router.push({
    name: 'Documents',
    query: { name: name }
  })
}


// 页面加载
onMounted(async () => {
  if (isLogin) {
    await fetchProfile()
  }
  await loadArticles()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.sidebar {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
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
</style>