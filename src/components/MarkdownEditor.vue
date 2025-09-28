<template>
  <div :class="isDark ? 'dark bg-gray-900 text-gray-100 min-h-screen p-6' : 'bg-gray-100 min-h-screen p-6'">
    <div class="max-w-6xl mx-auto">
      <el-card class="shadow-lg rounded-2xl">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <i class="fa fa-pencil-square text-indigo-500"></i>
              Markdown 编辑器
            </h2>
            <el-switch v-model="isDark" active-text="暗黑模式" inactive-text="明亮模式" />
          </div>
        </template>

        <!-- 工具栏 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <el-button type="primary" size="small" @click="downloadMd">
            <i class="fa fa-download"></i> 下载 .md
          </el-button>
          <el-button type="success" size="small" @click="downloadHtml">
            <i class="fa fa-code"></i> 下载 .html
          </el-button>

          <el-upload action="" :auto-upload="false" accept=".md" :on-change="importLocalFile" :show-file-list="false">
            <el-button type="warning" size="small">
              <i class="fa fa-upload"></i> 本地导入
            </el-button>
          </el-upload>
          
          <div style="margin-top: 6px;margin-bottom: 6px;">
            <el-input v-model="password" placeholder="后端密钥 (可选)" size="small" style="width: 100px;margin-right: 11px;" />
            <el-input v-model="fileName" placeholder="文件名" size="small" style="width: 100px;margin-right: 11px;" />

            <el-button type="success" size="small" @click="saveToBackend">
              <i class="fa fa-save"></i> 保存到后端
            </el-button>
            <el-button type="info" size="small" @click="loadFromBackend">
              <i class="fa fa-cloud-download"></i> 从后端加载
            </el-button>
          </div>
        </div>

        <!-- 编辑器 -->
        <MdEditor v-model="text" :theme="isDark ? 'dark' : 'light'" language="zh-CN" previewTheme="github"
          codeTheme="github" height="600px" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMarkdown, saveMarkdown } from '@/api/markdown'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

const text = ref(`# 欢迎使用在线 Markdown 编辑器

- 支持 KaTeX 公式: $E=mc^2$
- 支持代码高亮
`)
const password = ref('')
const isDark = ref(false)
const fileName = ref('')

/** 下载 Markdown */
const downloadMd = () => {
  const blob = new Blob([text.value], { type: 'text/markdown' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'document.md'
  link.click()
  URL.revokeObjectURL(link.href)
}

/** 下载 HTML */
const downloadHtml = () => {
  const htmlContent = `
    <html>
      <head><meta charset="utf-8"></head>
      <body>${text.value}</body>
    </html>
  `
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'document.html'
  link.click()
  URL.revokeObjectURL(link.href)
}

/** 本地导入 */
const importLocalFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    text.value = e.target.result
    ElMessage.success('导入成功')
  }
  reader.readAsText(file.raw)
}


/** 保存到后端 */
const saveToBackend = async () => {
  try {
    if (!fileName.value) {
      ElMessage.warning('请输入文件名')
      return
    }
    await saveMarkdown({ name: fileName.value, content: text.value, password: password.value, encrypted: false })
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

/** 从后端加载 */
const loadFromBackend = async () => {
  try {
    if (!fileName.value) {
      ElMessage.warning('请输入文件名')
      return
    }
    const res = await getMarkdown(fileName.value)
    text.value = res?.content || ''
    ElMessage.success('加载成功')
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

</script>

<style scoped>
.dark .el-card {
  background: #1f2937;
  color: #f3f4f6;
}
</style>
