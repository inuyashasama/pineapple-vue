<template>
  <div :class="isDark ? 'dark bg-gray-900 text-gray-100 min-h-screen p-6' : 'bg-gray-100 min-h-screen p-6'">
    <div class="max-w-6xl mx-auto">
      <el-card class="shadow-lg rounded-2xl">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <i class="fa fa-file-text-o text-indigo-500"></i>
              {{ props.title }}
            </h2>
            <el-switch v-model="isDark" active-text="暗黑模式" inactive-text="明亮模式" />
          </div>
        </template>

        <!-- 工具栏 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <el-button type="primary" size="small" @click="downloadTxt">
            <i class="fa fa-download"></i> 下载 .txt
          </el-button>

          <el-upload action="" :auto-upload="false" accept=".txt" :on-change="importLocalFile" :show-file-list="false">
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

        <!-- 文本编辑器 -->
        <textarea 
          v-model="text" 
          :class="isDark ? 'dark-textarea' : 'light-textarea'"
          style="width: 100%; height: 600px; padding: 16px; border-radius: 8px; resize: none;"
          placeholder="在此输入文本内容..."
        ></textarea>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getArticle, createArticle } from '@/api/article'
import { useRoute } from 'vue-router'
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

import { onMounted } from 'vue'

const text = ref('')
const password = ref('')
const isDark = ref(false)
const fileName = ref('')
const fileId = ref(null)

const route = useRoute()

const props = defineProps({
  title: {
    type: String,
    default: 'Text Editor'
  }
})

const emit = defineEmits(['update:content'])

// 监听文本变化并通知父组件
watch(text, (newText) => {
  emit('update:content', newText)
})

/** 下载 TXT */
const downloadTxt = () => {
  const blob = new Blob([text.value], { type: 'text/plain' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  const downloadName = fileName.value || 'document'
  link.download = downloadName + '.txt'
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
    await createArticle({ id: fileId.value, userId: LocalStorageUtil.get('userId'), title: fileName.value, content: text.value, views:1, filetype:'txt' })
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败' + err?.message || '')
  }
}

/** 从后端加载 */
const loadFromBackend = async () => {
  try {
    if (!fileName.value) {
      ElMessage.warning('请输入文件名')
      return
    }
    const res = await getArticle(fileId.value)
    text.value = res?.content || ''
  } catch (err) {
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  fileName.value = route.query.name
  fileId.value = route.query.id
  if (fileName.value && fileId.value) {
    loadFromBackend()
  }
})
</script>

<style scoped>
.dark .el-card {
  background: #1f2937;
  color: #f3f4f6;
}

.dark-textarea {
  background-color: #1f2937;
  color: #f3f4f6;
  border: 1px solid #4b5563;
}

.light-textarea {
  background-color: white;
  color: #1f2937;
  border: 1px solid #d1d5db;
}
</style>