<template>
  <div class="ai-chat-root">
    <el-card class="ai-chat-card">
      <div class="ai-header">
        <div class="left">
          <h3>AI 助手</h3>
          <el-tag type="success" size="small">模式: {{ aiMode }}</el-tag>
        </div>
        <div class="ai-actions">
          <el-button type="text" size="small" @click="clearMessages">清空</el-button>
          <el-button v-if="streaming" type="danger" size="small" @click="stopStreaming">停止</el-button>
        </div>
      </div>

      <div class="chat-body" ref="chatBody">
        <div v-for="(m, idx) in messages" :key="idx" :class="['chat-message', m.role]">
          <div class="avatar" :class="m.role">{{ m.role === 'user' ? '你' : (m.role === 'system' ? '系统' : 'AI') }}</div>
          <div class="bubble-wrap">
            <div class="bubble" v-html="formatContent(m.content)"></div>
          </div>
        </div>
        <div v-if="streaming" class="streaming-indicator">AI 正在思考<span class="dots">...</span></div>
      </div>

      <div class="chat-input">
        <el-input type="textarea" v-model="input" :rows="3" placeholder="输入问题，按回车发送（Shift+Enter 换行）" @keydown.enter.native="handleEnter"></el-input>
        <div class="input-actions">
          <el-button :loading="sending" type="primary" @click="onSend">发送</el-button>
          <el-button @click="toggleAiQueryMode" size="small">切换模式</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import ai, { aiChatStream } from '@/api/ai'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

const messages = ref<Msg[]>([])
const input = ref('')
const sending = ref(false)
const aiMode = ref<'chat' | 'query'>('chat')
const chatBody = ref<HTMLElement | null>(null)
const streaming = ref(false)
const abortFn = ref<null | (() => void)>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
}

const onSend = async () => {
  const t = input.value.trim()
  if (!t) return
  messages.value.push({ role: 'user', content: t })
  input.value = ''
  sending.value = true
  await scrollToBottom()
  try {
    if (aiMode.value === 'chat') {
      // 尝试使用流式接口
      try {
        const { stream, abort } = aiChatStream(messages.value)
        abortFn.value = abort
        streaming.value = true
        // 预先插入一个空的 assistant 消息，用于逐块填充
        const idx = messages.value.push({ role: 'assistant', content: '' }) - 1
        for await (const chunk of stream) {
          // 将 chunk 追加到当前 assistant 消息
          messages.value[idx].content += chunk
          await scrollToBottom()
        }
        // 流读完毕
        abortFn.value = null
        streaming.value = false
      } catch (streamErr) {
        // 如果流式失败，回退到普通请求
        console.warn('ai stream failed, fallback to non-stream', streamErr)
        const res: any = await ai.aiChat(messages.value)
        const reply = res?.data?.reply || res?.reply || (typeof res === 'string' ? res : res?.data)
        if (reply) messages.value.push({ role: 'assistant', content: String(reply) })
        else throw new Error('后端未返回 reply 字段')
      }
    } else {
      const res: any = await ai.aiQuery(t)
      const reply = res?.data?.reply || res?.reply || (typeof res === 'string' ? res : res?.data)
      if (reply) messages.value.push({ role: 'assistant', content: String(reply) })
      else throw new Error('后端未返回 reply 字段')
    }
  } catch (err: any) {
    // 回退到本地 mock
    try {
      const m = await ai.mockAiReply(t)
      messages.value.push({ role: 'assistant', content: m.reply })
      ElMessage.info('使用本地模拟回复（后端请求失败）')
    } catch (e) {
      ElMessage.error(err?.message || 'AI 请求失败')
    }
  } finally {
    sending.value = false
    streaming.value = false
    abortFn.value = null
    await scrollToBottom()
  }
}

const stopStreaming = () => {
  if (abortFn.value) {
    try { abortFn.value() } catch (e) { console.warn('abort error', e) }
  }
  streaming.value = false
  abortFn.value = null
}

// Enter 行为：如果按住 Shift+Enter 则换行，否则发送
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return
  e.preventDefault()
  onSend()
}

const clearMessages = () => { messages.value = [] }
const toggleAiQueryMode = () => { aiMode.value = aiMode.value === 'chat' ? 'query' : 'chat' }

onMounted(() => {
  // 系统提示初始化
  messages.value.push({ role: 'system', content: '你好，我是 AI 助手，你可以问我问题，或开启查询模式。' })
  scrollToBottom()
})

const formatContent = (text: string) => {
  if (!text) return ''
  // 简单转义并保留换行
  const escaped = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\n/g, '<br/>')
}
</script>

<style scoped>
.ai-chat-root { padding: 20px }
.ai-chat-card { max-width: 900px; margin: 0 auto }
.ai-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
.chat-body { max-height: 60vh; overflow:auto; padding: 10px; background:#fafbfd; border-radius:6px }
.chat-message { margin:8px 0; display:flex; gap:8px }
.chat-message .meta { font-size:12px; color:#888; min-width:40px }
.chat-message.user .content { background:#e6f7ff; color:#000; padding:8px 12px; border-radius:8px }
.chat-message.assistant .content { background:#fff; color:#000; padding:8px 12px; border-radius:8px; border:1px solid #f0f0f0 }
.chat-message.system .content { font-size:12px; color:#666 }
.chat-input { margin-top:12px; display:flex; flex-direction:column; gap:8px }
.input-actions { display:flex; gap:8px; justify-content:flex-end }
</style>
