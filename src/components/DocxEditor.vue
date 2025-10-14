<template>
  <div :class="isDark ? 'dark bg-gray-900 text-gray-100 min-h-screen p-6' : 'bg-gray-100 min-h-screen p-6'">
    <div class="max-w-6xl mx-auto">
      <el-card class="shadow-lg rounded-2xl">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <i class="fa fa-file-word-o text-indigo-500"></i>
              {{ props.title }}
            </h2>
            <el-switch v-model="isDark" active-text="暗黑模式" inactive-text="明亮模式" />
          </div>
        </template>

        <!-- 工具栏 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <el-button type="primary" size="small" @click="downloadDocx">
            <i class="fa fa-download"></i> 下载 .docx
          </el-button>

          <el-upload action="" :auto-upload="false" accept=".docx" :on-change="importLocalFile" :show-file-list="false">
            <el-button type="warning" size="small">
              <i class="fa fa-upload"></i> 本地导入
            </el-button>
          </el-upload>
          
          <div style="margin-top: 6px;margin-bottom: 6px;">
            <el-input v-model="fileName" placeholder="文件名" size="small" style="width: 100px;margin-right: 11px;" />

            <el-button type="success" size="small" @click="saveToBackend">
              <i class="fa fa-save"></i> 保存到后端
            </el-button>
            <el-button type="info" size="small" @click="loadFromBackend">
              <i class="fa fa-cloud-download"></i> 从后端加载
            </el-button>
          </div>
        </div>

        <!-- DOCX 预览区域 -->
        <div 
          :class="isDark ? 'dark-preview' : 'light-preview'"
          style="width: 100%; height: 600px; padding: 16px; border-radius: 8px; overflow-y: auto;"
        >
          <!-- 添加用于 docx-preview 的容器 -->
          <div id="docx-container" v-show="hasDocxFile" style="width: 100%; height: 100%;"></div>
          <div v-if="!hasDocxFile" class="flex items-center justify-center h-full">
            <p>导入 DOCX 文件以查看内容</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref,nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

import { getArticle, createArticle } from '@/api/article'
import { onMounted } from 'vue'
import { renderAsync } from 'docx-preview'

const docxContent = ref('')
const isDark = ref(false)
const fileName = ref('')
const fileId = ref(null)
const hasDocxFile = ref(false) // 新增状态跟踪是否有 DOCX 文件
const route = useRoute()

const props = defineProps({
  title: {
    type: String,
    default: 'DOCX Editor'
  }
})

const emit = defineEmits(['update:content'])

/** 下载 DOCX */
const downloadDocx = () => {
  // 对于 DOCX 文件，我们只能下载原始文件而不是生成新文件
  ElMessage.info('请从后端获取原始 DOCX 文件')
}

/** 本地导入 */
const importLocalFile = async (file) => {
  try {
    // 设置状态表示已有文件
    hasDocxFile.value = true
    
    // 等待 DOM 更新后再执行渲染
    await nextTick()
    
    // 使用 docx-preview 库来预览 DOCX 内容
    const container = document.getElementById("docx-container")
    if (container) {
      await renderAsync(file.raw, container)
      ElMessage.success('DOCX 文件加载成功')
    } else {
      throw new Error('无法找到 DOCX 容器')
    }
    
    // 发送文件内容事件
    emit('update:content', file.raw)
  } catch (error) {
    console.error('DOCX 渲染失败:', error)
    ElMessage.error('DOCX 文件渲染失败: ' + error.message)
    
    // 失败时回退到显示文件信息
    hasDocxFile.value = false
    docxContent.value = `<h3>DOCX 文件信息</h3>
                         <p>文件名: ${file.raw.name}</p>
                         <p>文件大小: ${(file.raw.size / 1024).toFixed(2)} KB</p>
                         <p>最后修改: ${new Date(file.raw.lastModified).toLocaleString()}</p>`
  }
}

/** 保存到后端 */
const saveToBackend = async () => {
  try {
    if (!fileName.value) {
      ElMessage.warning('请输入文件名')
      return
    }
    // 注意：这里可能需要调整，因为 DOCX 是二进制文件
    await createArticle({ 
      id: fileId.value, 
      userId: localStorage.getItem('userId') || '', 
      title: fileName.value, 
      content: 'DOCX file content', // 实际应用中需要处理二进制数据
      views: 1, 
      fileType: 'docx' 
    })
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败: ' + err?.message || '')
  }
}

/** 从后端加载 */
const loadFromBackend = async () => {
  try {
    if (!fileId.value) {
      ElMessage.warning('缺少文件ID')
      return
    }
    const res = await getArticle(fileId.value)
    // DOCX 文件的处理方式与文本不同，需要特殊处理
    if (res?.content) {
      hasDocxFile.value = true
      docxContent.value = res.content
    }
  } catch (err) {
    ElMessage.error('加载失败: ' + err.message)
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