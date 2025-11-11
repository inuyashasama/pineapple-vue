<template>
  <div class="doc-editor-root">
    <!-- 顶部工具栏 -->
    <header class="editor-toolbar">
      <div class="toolbar-inner">
        <div class="toolbar-left">
          <h1 class="editor-title">文档编辑器</h1>
          <el-input v-model="fileName" placeholder="文件名" size="small" class="file-name" />

          <el-select v-model="documentType" placeholder="文档类型" size="small" @change="onDocumentTypeChange"
            class="doc-type-select">
            <el-option label="Markdown" value="md"></el-option>
            <el-option label="Text" value="txt"></el-option>
            <el-option label="DOCX" value="docx"></el-option>
          </el-select>
        </div>

        <div class="toolbar-right">
          <div class="save-status">{{ unsaved ? '未保存' : (lastSavedTime ? `已保存 ${lastSavedTime}` : '') }}</div>
          <el-button type="primary" size="small" :loading="isSaving" @click="saveDocument">
            <i class="el-icon-check" /> 保存 (Ctrl+S)
          </el-button>
          <el-button size="small" @click="previewVisible = true"><i class="el-icon-view" /> 预览</el-button>
        </div>
      </div>
    </header>

    <!-- 主体：编辑器 + 右侧元数据面板 -->
    <main class="editor-main">
      <section class="editor-area">
        <component :is="currentEditorComponent" :title="editorTitle" :key="documentType" :content="documentContent"
          @update:content="handleContentUpdate" />
      </section>

      <aside class="meta-panel">
        <div class="meta-card">
          <h3>文档信息</h3>
          <div class="meta-row"><label>类型</label><span>{{ documentTypeLabel }}</span></div>
          <div class="meta-row"><label>文件名</label><span>{{ fileName || '未命名' }}</span></div>
          <div class="meta-row"><label>最后保存</label><span>{{ lastSavedTime || '未保存' }}</span></div>
        </div>

        <div class="meta-card">
          <h3>封面</h3>
          <div class="cover-preview" v-if="coverImage">
            <img :src="coverImage" alt="cover" />
            <div class="cover-actions">
              <el-button size="mini" @click="removeCover">移除</el-button>
            </div>
          </div>
          <div v-else class="cover-placeholder">暂无封面</div>
          <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="onCoverUpload" />
          <el-button size="small" @click="openCoverInput">上传封面</el-button>
        </div>

        <div class="meta-card">
          <h3>标签</h3>
          <el-input v-model="tagInput" placeholder="输入标签并回车" size="small" @keyup.enter.native="addTag" />
          <div class="tags-list">
            <el-tag v-for="t in tags" :key="t" closable @close="removeTag(t)">{{ t }}</el-tag>
            <div v-if="tags.length === 0" class="muted">暂无标签</div>
          </div>
        </div>
      </aside>
    </main>

    <!-- 预览弹窗 -->
    <el-dialog v-model:visible="previewVisible" width="70%" title="文档预览">
      <div class="preview-body">
        <pre>{{ documentContent }}</pre>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="previewVisible = false">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { uploadAvatar } from '@/api/upload'
import { getArticle, updateArticle, createArticle } from '@/api/article'

// @ts-ignore - components may not have .d.ts in this project
import MarkdownEditor from '@/components/MarkdownEditor.vue';
// @ts-ignore
import TextEditor from '@/components/TextEditor.vue';
// @ts-ignore
import DocxEditor from '@/components/DocxEditor.vue';
import { BASE_URL } from '@/config/config';
import { Article } from '@/types/article';

const documentType = ref('md');
const fileName = ref('');
const documentContent = ref('');
const isSaving = ref(false)
const lastSavedTime = ref('')
const lastSavedContent = ref('')
const previewVisible = ref(false)

const coverImage = ref < string | null > (null)
const coverInput = ref < HTMLInputElement | null > (null)

const tags = ref < string[] > ([])
const tagInput = ref('')
let keyHandler: ((e: KeyboardEvent) => void) | null = null
const route = useRoute();

// 解析 route.query.id 为 number，兼容 string | string[] | undefined
const articleId = computed<number | undefined>(() => {
  const v = route.query.id
  if (!v) return undefined
  if (Array.isArray(v)) return Number(v[0]) || undefined
  const n = Number(v as string)
  return Number.isNaN(n) ? undefined : n
})

// 使用 shallowRef 避免深层响应式转换
const currentEditorComponent = shallowRef(MarkdownEditor);

const editorTitle = computed(() => {
  switch (documentType.value) {
    case 'md': return 'Markdown 编辑器';
    case 'txt': return '文本编辑器';
    case 'docx': return 'DOCX 编辑器';
    default: return '文档编辑器';
  }
});

const documentTypeLabel = computed(() => {
  return documentType.value === 'md' ? 'Markdown' : documentType.value === 'txt' ? 'Text' : 'DOCX'
})

const unsaved = computed(() => documentContent.value !== lastSavedContent.value)

const onDocumentTypeChange = (newType: string) => {
  switch (newType) {
    case 'md':
      currentEditorComponent.value = MarkdownEditor;
      break;
    case 'txt':
      currentEditorComponent.value = TextEditor;
      break;
    case 'docx':
      currentEditorComponent.value = DocxEditor;
      break;
    default:
      currentEditorComponent.value = MarkdownEditor;
  }
};

const handleContentUpdate = (content: string) => {
  documentContent.value = content;
};


// 保存文档功能
const saveDocument = async () => {
  try {
    isSaving.value = true
    // 如果有 articleId -> update，否则 create
    const payload = {
      id: articleId.value,
      title: fileName.value,
      content: documentContent.value,
      filetype: documentType.value,
      imageUrl: coverImage.value,
    } as any

    if (articleId.value) {
      await updateArticle(payload)
    } else {
      await createArticle(payload)
    }

    lastSavedContent.value = documentContent.value
    lastSavedTime.value = new Date().toLocaleTimeString()
    ElMessage.success('保存成功')
  } catch (err: any) {
    ElMessage.error(err?.message || '保存失败')
  } finally {
    isSaving.value = false
  }
};

// 预览文档功能
const previewDocument = () => {
  previewVisible.value = true
};

onMounted(async () => {
  // 默认加载 Markdown 编辑器
  const qfile = route.query.filetype
  documentType.value = Array.isArray(qfile) ? (qfile[0] || 'md') : (qfile as string) || 'md'
  const qname = route.query.name
  fileName.value = Array.isArray(qname) ? (qname[0] || '') : (qname as string) || ''

  if (documentType.value) {
    currentEditorComponent.value = documentType.value === 'md' ? MarkdownEditor :
      documentType.value === 'txt' ? TextEditor : DocxEditor;
  } else {
    currentEditorComponent.value = MarkdownEditor;
    documentType.value = 'md';
  }
  // 绑定 Ctrl+S 快捷键
  keyHandler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      saveDocument()
    }
  }
  window.addEventListener('keydown', keyHandler)

  if (articleId.value) {
  const res = await getArticle(articleId.value) as unknown as Article
    // 填充基本字段到编辑器
    fileName.value = res.title || fileName.value
    documentContent.value = res.content || documentContent.value
    documentType.value = (res.filetype as string) || documentType.value
    coverImage.value = res.imageUrl || null
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && keyHandler) window.removeEventListener('keydown', keyHandler)
})

// 封面上传 — 上传到后端并使用返回的 URL
const onCoverUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  try {
    isSaving.value = true
    const res: any = await uploadAvatar(file)
    // API 可能返回不同结构，尝试读取常见字段
    const url = res?.url || res?.data?.url || res?.data || res
    if (typeof url === 'string') {
      if (url.startsWith('http')) {
        coverImage.value = url
      } else if (url.startsWith('/')) {
        coverImage.value = BASE_URL.replace(/\/$/, '') + url
      } else if (url.startsWith('data:')) {
        // 有些后端会直接返回 base64
        coverImage.value = url
      } else {
        // 相对路径或其它，补上 BASE_URL
        coverImage.value = BASE_URL.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
      }
    } else if (typeof res === 'string') {
      // 有些接口直接返回字符串路径
      const s = res
      coverImage.value = s.startsWith('http') ? s : BASE_URL.replace(/\/$/, '') + '/' + s.replace(/^\//, '')
    } else {
      // 无法解析返回值，尝试将整个返回对象序列化为字符串（回退）
      coverImage.value = JSON.stringify(res)
    }
    ElMessage.success('封面上传成功')
  } catch (err: any) {
    console.error('上传封面失败', err)
    ElMessage.error(err?.message || '上传失败')
  } finally {
    isSaving.value = false
  }
}

const openCoverInput = () => { coverInput.value?.click() }
const removeCover = () => { coverImage.value = null }

// 标签操作
const addTag = () => {
  const v = tagInput.value.trim()
  if (v && !tags.value.includes(v)) tags.value.push(v)
  tagInput.value = ''
}
const removeTag = (t: string) => { tags.value = tags.value.filter(x => x !== t) }
</script>

<style scoped>
.doc-editor-root {
  min-height: 100vh;
  background: #f6f8fb;
  padding-bottom: 40px;
}

.editor-toolbar {
  background: #fff;
  border-bottom: 1px solid #eef2f6;
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.04);
  position: sticky;
  top: 0;
  z-index: 20;
}

.toolbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px
}

.editor-title {
  font-size: 18px;
  margin: 0;
  color: #243b53
}

.file-name {
  width: 260px
}

.doc-type-select {
  width: 120px
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px
}

.save-status {
  font-size: 13px;
  color: #888;
  margin-right: 6px
}

.editor-main {
  max-width: 1280px;
  margin: 18px auto;
  display: flex;
  gap: 20px;
  align-items: flex-start
}

.editor-area {
  flex: 1;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.04)
}

.meta-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px
}

.meta-card {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.04)
}

.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9
}

.meta-row:last-child {
  border-bottom: none
}

.cover-preview img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px
}

.cover-actions {
  margin-top: 8px
}

.cover-placeholder {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa4b2;
  background: #fbfdff;
  border-radius: 6px
}

.tags-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px
}

.muted {
  color: #9aa4b2
}

.preview-body {
  max-height: 60vh;
  overflow: auto;
  background: #fff;
  padding: 12px;
  border-radius: 6px
}

@media (max-width: 900px) {
  .editor-main {
    padding: 0 12px;
    flex-direction: column
  }

  .meta-panel {
    width: 100%
  }
}
</style>