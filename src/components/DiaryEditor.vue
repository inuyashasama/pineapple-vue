<!-- src/components/DiaryEditor.vue -->
<template>
  <div class="diary-editor">
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="请输入日记标题" />
      </el-form-item>
      
      <el-form-item label="日期">
        <el-date-picker 
          v-model="form.date" 
          type="date" 
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
        />
      </el-form-item>
      
      <el-form-item label="内容">
        <el-input 
          v-model="form.content" 
          type="textarea" 
          :rows="10" 
          placeholder="写下您的日记内容..."
        />
      </el-form-item>
    </el-form>
    
    <div class="editor-actions">
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Article } from '@/types/article'

const props = defineProps<{
  diaryEntry: Article | null
}>()

const emit = defineEmits<{
  (e: 'save', entry: Article): void
  (e: 'close'): void
}>()

const form = ref({
  id: '',
  title: '',
  date: '',
  content: ''
})

// 监听传入的日记条目变化
watch(() => props.diaryEntry, (newVal) => {
  if (newVal) {
    // map Article -> form shape, ensure id is string and date is provided (use createTime fallback)
    form.value = {
      id: newVal.id !== undefined && newVal.id !== null ? String(newVal.id) : '',
      title: newVal.title ?? '',
      date: (newVal as any).date ?? (newVal.createTime ? newVal.createTime.split('T')[0] : new Date().toISOString().split('T')[0]),
      content: newVal.content ?? ''
    }
  } else {
    form.value = {
      id: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      content: ''
    }
  }
}, { immediate: true })

// 保存日记
const handleSave = () => {
  if (!form.value.title || !form.value.content) {
    // 提示用户填写必要信息
    return
  }
  
  emit('save', { ...form.value, id: Number(form.value.id) })
}
</script>