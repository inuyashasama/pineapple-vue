<template>
  <div class="home-container">

    <!-- 主体内容 -->
    <el-main class="main">
      <h2>文章列表</h2>

      <!-- 文章列表 -->
      <div v-for="article in articles" :key="article.id" class="article-item">
        <h3 @click="goToDetail(article.id)" class="article-title">
          {{ article.title }}
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
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getArticles } from '@/api'
import { Page, Article } from '@/types/response'
import { ElMessage } from 'element-plus'

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
    // 暂时从 token 解码？或调用接口
    // 先 mock 一下
    userInfo.value.username = 'User' + Date.now() % 1000
  }
}

// 加载文章列表
const loadArticles = async (page = 1) => {
  try {
    const data = await getArticles(page, pageSize.value)
    articles.value = data.records
    total.value = data.total
    currentPage.value = page
  } catch (err) {
    // 错误已在拦截器中提示
  }
}

// 跳转详情
const goToDetail = (id: number) => {
  router.push(`/article/${id}`)
}

// 跳转登录/注册
const goToLogin = () => {
  router.push('/login')
}
const goToRegister = () => {
  router.push('/register')
}

// 退出登录
const handleLogout = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    ElMessage.success('已退出')
    router.push('/login')
  }
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.article-item {
  background: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.article-item:hover {
  transform: translateY(-2px);
}

.article-title {
  font-size: 1.4em;
  color: #333;
  margin: 0 0 10px;
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
</style>