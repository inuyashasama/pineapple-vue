<template>
    <div class="ai-chat-root">
        <el-card class="ai-chat-card">
            <div class="ai-header">
                <div class="title-area">
                    <h2 class="title">菠萝助手</h2>
                    <div class="subtitle">写作、查询、润色与问答 · 智能辅助</div>
                </div>
                <div class="ai-actions">
                    <el-tag type="success" size="small">模式: {{ modeLabel }}</el-tag>
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
                                <!-- 视频播放器 -->
                                <div v-if="m.videoUrl" class="video-container">
                                    <video :src="m.videoUrl" controls
                                        style="width: 100%; height: auto; margin-top: 10px;" crossorigin="anonymous"
                                        @error="onVideoError"></video>
                                    <div class="video-actions">
                                        <el-button size="small" @click="openInNewTab(m.videoUrl)">在新标签页打开</el-button>
                                    </div>
                                </div>
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
    <el-dialog v-model:visible="videoDialogVisible" width="70%" title="播放视频" @close="closeVideoDialog">
        <div style="min-height:240px;">
            <div style="margin-bottom:8px; display:flex; gap:8px;">
                <el-button size="small" type="primary" @click="openInNewTab(currentVideoUrl)">在新标签页打开</el-button>
                <el-button size="small" @click="fetchAndPlay(currentVideoUrl)">尝试下载并播放（fetch）</el-button>
            </div>
            <video v-if="currentVideoUrl" :src="currentVideoUrl" controls style="width:100%; height:auto"
                crossorigin="anonymous" @error="onVideoError"></video>
            <div v-else>未找到视频地址</div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ai, { aiChatStream, text2Video } from '@/api/ai'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string; time?: string; videoUrl?: string }

const messages = ref<Msg[]>([])
const input = ref('')
const sending = ref(false)
const aiMode = ref<'chat' | 'query' | 'video'>('chat')
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
                const { stream, abort } = aiChatStream(messages.value, aiModel.value)
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
                abortFn.value = null
                streaming.value = false
            } catch (streamErr) {
                // 如果流式失败，回退到普通请求
                console.warn('ai stream failed, fallback to non-stream', streamErr)
                const res: any = await ai.aiChat(messages.value, aiModel.value)
                const reply = res?.data?.reply || res?.reply || (typeof res === 'string' ? res : res?.data)
                if (reply) pushAssistantReply(String(reply))
                else throw new Error('后端未返回 reply 字段')
            }
        } else if (aiMode.value === 'video') {
            // 调用文生视频接口，后端应返回视频 URL
            const res: any = await text2Video(t, aiModel.value)
            // 解析常见返回结构
            const videoUrl = res?.url || res?.data?.url || res?.videoUrl || (typeof res === 'string' ? res : res?.data)
            if (videoUrl) {
                pushAssistantReply('已生成视频，点击播放', String(videoUrl))
            } else {
                ElMessage.error('未获取到视频地址')
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
// 添加计算属性处理模式标签显示
const modeLabel = computed(() => {
    switch (aiMode.value) {
        case 'chat': return '对话'
        case 'query': return '查询'
        case 'video': return '文生视频'
        default: return '对话'
    }
})

const toggleAiQueryMode = () => {
    if (aiMode.value === 'chat') {
        aiMode.value = 'query'
    } else if (aiMode.value === 'query') {
        aiMode.value = 'video'
    } else {
        aiMode.value = 'chat'
    }
}

// 视频播放对话框状态与打开函数
const videoDialogVisible = ref(false)
const currentVideoUrl = ref<string | null>(null)

// 支持在新标签页打开或尝试 fetch->blob 回退（用于绕过部分跨域/签名问题）
const _blobUrlRef = ref<string | null>(null)
const openInNewTab = (url?: string | null) => {
    if (!url) {
        ElMessage.error('无视频地址可打开')
        return
    }
    try {
        window.open(url, '_blank')
    } catch (e) {
        console.warn('openInNewTab failed', e)
        ElMessage.error('无法在新标签页打开')
    }
}

const fetchAndPlay = async (url?: string | null) => {
    if (!url) {
        ElMessage.error('无视频地址可下载')
        return
    }
    try {
        ElMessage.info('开始下载视频（可能较大）')
        const resp = await fetch(url, { mode: 'cors' })
        if (!resp.ok) {
            ElMessage.error(`下载失败：${resp.status}`)
            console.warn('fetch failed', resp)
            return
        }
        const blob = await resp.blob()
        const obj = URL.createObjectURL(blob)
        if (_blobUrlRef.value) URL.revokeObjectURL(_blobUrlRef.value)
        _blobUrlRef.value = obj
        currentVideoUrl.value = obj
        videoDialogVisible.value = true
        ElMessage.success('下载完成，开始播放')
    } catch (e: any) {
        console.error('fetchAndPlay error', e)
        ElMessage.error('下载或播放失败（可能被跨域阻止）')
    }
}

const onVideoError = (ev?: any) => {
    ElMessage.error('视频加载失败，尝试在新标签页打开或检查跨域策略')
}

const closeVideoDialog = () => {
    currentVideoUrl.value = null
    videoDialogVisible.value = false
    if (_blobUrlRef.value) {
        try { URL.revokeObjectURL(_blobUrlRef.value) } catch (e) { console.warn(e) }
        _blobUrlRef.value = null
    }
}
const applyPromptAndSend = async (p: string) => {
    input.value = p
    await nextTick()
    onSend()
}

// Helper to push assistant replies with simple deduplication to avoid double-posts
const pushAssistantReply = (text: string, videoUrl?: string) => {
    const now = new Date().toLocaleTimeString()
    // find last assistant message
    for (let i = messages.value.length - 1; i >= 0; i--) {
        if (messages.value[i].role === 'assistant') {
            if (messages.value[i].content === text && messages.value[i].videoUrl === (videoUrl || undefined)) {
                // identical to last assistant message, skip
                return
            }
            break
        }
    }
    messages.value.push({ role: 'assistant', content: text, time: now, videoUrl: videoUrl })
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

.bubble-wrap {
    position: relative
}

.video-thumb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #fafafa;
    border: 1px solid #eef2f6;
    cursor: pointer;
    color: #2b6cb0;
    width: fit-content;
    user-select: none;
    z-index: 2;
}

.video-thumb:hover {
    background: #f0f7ff
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

.video-container {
    margin-top: 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #eef2f6;
}

.video-actions {
    padding: 8px;
    background: #f8f9fa;
    border-top: 1px solid #eef2f6;
}
</style>
