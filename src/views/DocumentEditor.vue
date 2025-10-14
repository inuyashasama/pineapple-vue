<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- 文档类型选择器 -->
    <div class="mb-6 max-w-6xl mx-auto">
      <el-card class="shadow-lg rounded-2xl border border-gray-200">
        <div class="flex items-center gap-4 py-3">
          <span class="font-medium text-gray-700">文档类型:</span>
          <el-select 
            v-model="documentType" 
            placeholder="请选择文档类型" 
            size="small"
            @change="onDocumentTypeChange"
            style="width: 150px;"
          >
            <el-option label="Markdown" value="md"></el-option>
            <el-option label="Text" value="txt"></el-option>
            <el-option label="DOCX" value="docx"></el-option>
          </el-select>
          
          <el-input 
            v-model="fileName" 
            placeholder="文件名" 
            size="small" 
            style="width: 200px;"
            v-if="documentType"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 动态加载对应编辑器 -->
    <div class="max-w-6xl mx-auto mt-6">
      <component 
        :is="currentEditorComponent" 
        :title="editorTitle"
        :key="documentType"
        @update:content="handleContentUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, onMounted } from 'vue';
import { useRoute } from 'vue-router'

import MarkdownEditor from '@/components/MarkdownEditor.vue';
import TextEditor from '@/components/TextEditor.vue';
import DocxEditor from '@/components/DocxEditor.vue';

const documentType = ref('md');
const fileName = ref('');
const documentContent = ref('');
const route = useRoute()

// 使用 shallowRef 避免深层响应式转换
const currentEditorComponent = shallowRef(MarkdownEditor);

const editorTitle = computed(() => {
  switch(documentType.value) {
    case 'md': return 'Markdown 编辑器';
    case 'txt': return '文本编辑器';
    case 'docx': return 'DOCX 编辑器';
    default: return '文档编辑器';
  }
});

const onDocumentTypeChange = (newType) => {
  switch(newType) {
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

const handleContentUpdate = (content) => {
  documentContent.value = content;
  console.log('文档内容更新:', content);
};

onMounted(() => {
  // 默认加载 Markdown 编辑器
  documentType.value = route.query.filetype;
  currentEditorComponent.value = route.query.filetype === 'md' ? MarkdownEditor : route.query.filetype === 'txt' ? TextEditor : DocxEditor;
});
</script>

<style>
body {
  background-color: #f9fafb; /* Tailwind bg-gray-50 hex value */
}
</style>