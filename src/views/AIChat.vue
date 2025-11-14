<template>
    <div class="ai-chat-root">
        <el-card class="ai-chat-card">
            <div class="ai-header">
                <div class="title-area">
                    <h2 class="title">菠萝助手</h2>
                    <div class="subtitle">写作、查询、润色与问答 · 智能辅助</div>
                </div>
                <div class="ai-actions">
                    <el-tag type="success" size="small">模式: {{ aiMode }}</el-tag>
                    <el-select v-model="aiModel" size="small" style="margin-left: 5px; width: 140px;"
                        @change="onModelChange">
                        <el-option v-for="model in availableModels" :key="model.value" :label="model.label"
                            :value="model.value" />
                    </el-select>
                    <el-button type="text" size="small" @click="clearMessages">清空</el-button>
                    <el-button v-if="streaming" type="danger" size="small" @click="stopStreaming">停止</el-button>
                </div>
            </div>

            <div class="ai-layout">
                <aside class="ai-side">
                    <h4>快速提示</h4>
                    <div class="prompts">
                        <el-tag v-for="(p, i) in quickPrompts" :key="i" type="info" @click="applyPromptAndSend(p)">{{ p
                        }}</el-tag>
                    </div>
                    <div class="help">
                        <h5>提示</h5>
                        <p>可点击快速提示，或在输入框中直接输入并回车发送。支持流式回复与停止操作。</p>
                    </div>
                </aside>

                <main class="ai-main">
                    <div class="chat-body" ref="chatBody">
                        <div v-for="(m, idx) in messages" :key="idx" :class="['chat-message', m.role]">
                            <div class="avatar" :class="m.role">{{ m.role === 'user' ? '你' : (m.role === 'system' ? '系统'
                                : 'AI') }}</div>
                            <div class="bubble-wrap">
                                <div class="bubble" v-html="formatContent(m.content)"></div>
                                <div class="meta">
                                    <span class="time">{{ m.time }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="streaming" class="streaming-indicator">AI 正在思考<span class="dots">...</span></div>
                    </div>
                </main>
            </div>

            <div class="chat-input sticky-input">
                <div class="input-row">
                    <el-input type="textarea" v-model="input" :rows="3" placeholder="输入问题，按回车发送（Shift+Enter 换行）"
                        @keydown.enter.native="handleEnter"></el-input>
                </div>
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
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string; time?: string }

const messages = ref<Msg[]>([])
const input = ref('')
const sending = ref(false)
const aiMode = ref<'chat' | 'query'>('chat')
const aiModel = ref('qwen-turbo')
const chatBody = ref<HTMLElement | null>(null)
const streaming = ref(false)
const abortFn = ref<null | (() => void)>(null)
const quickPrompts = ref<string[]>([
    '帮我润色这段文字',
    '帮我写一段文章摘要',
    '把这段话翻译成英文',
    '请给出改进建议',
])

// Usage limit settings
const USAGE_LIMIT_PER_DAY = 10 // 非 admin 每日调用上限，可调整
const username = LocalStorageUtil.get('username') || 'guest'
const isAdmin = username === 'admin'
const availableModels = [
  { label: '通义千问 Turbo', value: 'qwen-turbo' },
  { label: '通义千问 Plus', value: 'qwen-plus' },
  { label: '通义千问 Max', value: 'qwen-max' },
  // 可以根据需要添加更多模型
]

// 添加模型变更处理函数
const onModelChange = (newModel: string) => {
  ElMessage.success(`已切换至 ${availableModels.find(m => m.value === newModel)?.label || newModel} 模型`)
  // 可以在这里添加保存用户选择的逻辑
}
const usageKey = () => {
    const d = new Date()
    const day = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    return `ai_usage_${username}_${day}`
}

const getUsage = () => {
    const v = LocalStorageUtil.get(usageKey())
    return typeof v === 'number' ? v : (v ? Number(v) : 0)
}

const setUsage = (n: number) => {
    LocalStorageUtil.set(usageKey(), n)
}

const incrementUsage = () => {
    if (isAdmin) return
    const c = getUsage()
    setUsage(c + 1)
}


const applyPrompt = (p: string) => {
    input.value = p
}

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
                const idx = messages.value.push({ role: 'assistant', content: '', time: '' }) - 1
                for await (const chunk of stream) {
                    // 将 chunk 追加到当前 assistant 消息
                    messages.value[idx].content += chunk
                    await scrollToBottom()
                }
                // 流读完毕
                messages.value[idx].time = new Date().toLocaleTimeString()
                // 计数：流式完成时增加一次使用计数（非 admin）
                incrementUsage()
                abortFn.value = null
                streaming.value = false
            } catch (streamErr) {
                // 如果流式失败，回退到普通请求
                console.warn('ai stream failed, fallback to non-stream', streamErr)
                const res: any = await ai.aiChat(messages.value)
                const reply = res?.data?.reply || res?.reply || (typeof res === 'string' ? res : res?.data)
                if (reply) pushAssistantReply(String(reply))
                else throw new Error('后端未返回 reply 字段')
            }
        } else {
            const res: any = await ai.aiQuery(t)
            const reply = res?.data?.reply || res?.reply || (typeof res === 'string' ? res : res?.data)
            if (reply) pushAssistantReply(String(reply))
            else throw new Error('后端未返回 reply 字段')
        }
    } catch (err: any) {
        // 回退到本地 mock
        try {
            const m = await ai.mockAiReply(t)
            pushAssistantReply(m.reply)
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

const applyPromptAndSend = async (p: string) => {
    input.value = p
    await nextTick()
    onSend()
}

// Helper to push assistant replies with simple deduplication to avoid double-posts
const pushAssistantReply = (text: string) => {
    const now = new Date().toLocaleTimeString()
    // find last assistant message
    for (let i = messages.value.length - 1; i >= 0; i--) {
        if (messages.value[i].role === 'assistant') {
            if (messages.value[i].content === text) {
                // identical to last assistant message, skip
                return
            }
            break
        }
    }
    messages.value.push({ role: 'assistant', content: text, time: now })
    // increment usage for non-admins when pushing a completed assistant reply
    incrementUsage()
}

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
.ai-chat-root {
    padding: 20px
}

.ai-chat-card {
    max-width: 1100px;
    margin: 0 auto;
    padding: 16px;
    border-radius: 12px
}

.ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px
}

.title-area .title {
    margin: 0;
    font-size: 20px;
    color: #223
}

.title-area .subtitle {
    font-size: 12px;
    color: #7b8a95
}

.ai-layout {
    display: flex;
    gap: 16px
}

.ai-side {
    width: 220px;
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 6px rgba(16, 24, 40, 0.04)
}

.ai-side h4 {
    margin: 0 0 8px
}

.prompts {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.prompts .el-tag {
    cursor: pointer
}

.ai-main {
    flex: 1;
    display: flex;
    flex-direction: column
}

.chat-body {
    flex: 1;
    max-height: 60vh;
    overflow: auto;
    padding: 18px;
    background: linear-gradient(180deg, #fbfdff, #ffffff);
    border-radius: 10px;
    border: 1px solid #f1f5f9
}

.chat-message {
    margin: 10px 0;
    display: flex;
    gap: 12px;
    align-items: flex-end
}

.avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #fff
}

.avatar.user {
    background: #6fb3ff
}

.avatar.assistant {
    background: #7b8a95
}

.avatar.system {
    background: #ddd;
    color: #333
}

.bubble-wrap {
    max-width: calc(100% - 64px)
}

.bubble {
    padding: 12px 14px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    border: 1px solid #eef2f6;
    white-space: pre-wrap
}

.chat-message.user .bubble {
    background: linear-gradient(90deg, #e6f7ff, #dff3ff);
    border: none
}

.chat-message.assistant .bubble {
    background: #fff
}

.chat-message.system .bubble {
    background: transparent;
    color: #666;
    padding: 0
}

.meta {
    margin-top: 6px;
    font-size: 11px;
    color: #98a3ac
}

.meta .time {
    float: right
}

.streaming-indicator {
    text-align: center;
    color: #888;
    padding: 10px
}

.sticky-input {
    margin-top: 12px;
    border-top: 1px dashed #eef2f6;
    padding-top: 12px;
    position: sticky;
    bottom: 0;
    background: transparent
}

.input-row {
    margin-bottom: 8px
}

.chat-input .el-input__inner {
    min-height: 60px
}

.input-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end
}

@media (max-width: 900px) {
    .ai-layout {
        flex-direction: column
    }

    .ai-side {
        width: 100%
    }
}
</style>
