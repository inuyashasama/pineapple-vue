<template>
  <div class="home-container">

    <!-- 添加签到组件 -->
    <SignIn ref="signInRef" />
    <!-- 主体内容 -->
    <el-main class="main">
      <div class="content-wrapper">
        <!-- 👇 新增：签到组件 -->
        <!-- 文章内容区域 -->
        <div class="articles-content">
          <!-- <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all"></el-tab-pane>
            <el-tab-pane label="Markdown" name="md"></el-tab-pane>
            <el-tab-pane label="文本" name="txt"></el-tab-pane>
            <el-tab-pane label="Word" name="docx"></el-tab-pane>
            <el-tab-pane label="PDF" name="pdf"></el-tab-pane>
          </el-tabs> -->
          <div v-for="article in articles" :key="article.id" class="article-item">
            <h3 @click="goToDetail(article.name, article.id)" class="article-title">
              {{ article.name }}
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
            <li v-for="article in articles" :key="article.id" @click="goToDetail(article.name, article.id)"
              class="sidebar-article-item">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getArticles } from '@/api/markdown'
import { Article } from '@/types/article'
import SignIn from '@/components/SignIn.vue'
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

// 路由
const router = useRouter()

// 添加 tab 相关的响应式数据
const activeTab = ref('all')

// 登录状态
const isLogin = !!LocalStorageUtil.get('token')
const userInfo = ref<{ username: string }>({ username: '用户' })

// 文章列表
const articles = ref<Article[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 根据当前 tab 过滤文章
// const filteredArticles = computed(() => {
//   if (activeTab.value === 'all') {
//     return articles.value
//   }
//   return articles.value.filter(article => {
//     // 假设文章对象中有 fileType 字段，如果没有需要根据文件名后缀判断
//     if (article.fileType) {
//       return article.fileType.toLowerCase() === activeTab.value
//     }
//     // 根据文件名后缀判断
//     if (article.name) {
//       const ext = article.name.split('.').pop()?.toLowerCase()
//       return ext === activeTab.value
//     }
//     return false
//   })
// })

// 处理 tab 切换
const handleTabChange = (tabName: string) => {
  // 重新加载对应类型的文章
  loadArticles()
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
    const data = await getArticles(page, pageSize.value) as any
    articles.value = data.records
    total.value = data.total
    currentPage.value = page
  } catch (err) {
    // 错误已在拦截器中提示
  }
}

// 跳转详情
const goToDetail = (name: string, id: number) => {
  router.push({
    name: 'Documents',
    query: { name: name, id: id }
  })
}


// 页面加载
onMounted(async () => {
  if (isLogin) {
    await fetchProfile()
  }
  await loadArticles()
})
// 获取子组件实例
const signInRef = ref<InstanceType<typeof SignIn> | null>(null)

// 打开签到弹窗
const openSignIn = () => {
  console.log(signInRef.value);

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
</style>