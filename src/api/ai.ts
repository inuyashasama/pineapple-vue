import request from './request'
import { BASE_URL } from '@/config/config'
import { LocalStorageUtil } from '@/stroage/LocalStorageUtil'

/**
 * aiChat: 兼容后端两种风格。
 * - 优先按你提供的后端实现调用 `POST ${BASE_URL}/chat`，以 form 参数 `message` 传入内容，返回纯文本字符串。
 * - 若该请求失败（或后端采用不同实现），回退到项目原先的 `request.post('/api/ai/chat', payload)`。
 */
export async function aiChat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, opts?: { model?: string; temperature?: number }) {
  const userContents = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
  const message = userContents || (messages[0] && messages[0].content) || ''

  try {
    const url = (BASE_URL || '') + '/api/ai/chat'
    const userId = LocalStorageUtil.get('userId') || ''
    const body = new URLSearchParams({ message, userId })
    const token = LocalStorageUtil.get('token')
    const headers: Record<string, string> = { Accept: 'text/plain, */*' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(url, { method: 'POST', headers, body })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`AI chat request failed: ${res.status} ${txt}`)
    }
    const text = await res.text()
    return { reply: text }
  } catch (err) {
    console.log("ai/chat error:" + err);
    const payload = {
      messages,
      model: opts?.model || 'gpt-4o-mini',
      temperature: opts?.temperature ?? 0.7,
      userId: LocalStorageUtil.get('userId') || null,
    }
    return request.post('/api/ai/chat', payload)
  }
}

export async function aiQuery(prompt: string, opts?: { model?: string }) {
  try {
    const url = (BASE_URL || '') + '/api/ai/chat'
    const userId = LocalStorageUtil.get('userId') || ''
    const body = new URLSearchParams({ message: prompt, userId })
    const token = LocalStorageUtil.get('token')
    const headers: Record<string, string> = { Accept: 'text/plain, */*' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(url, { method: 'POST', headers, body })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`AI query failed: ${res.status} ${txt}`)
    }
    const text = await res.text()
    return { reply: text }
  } catch (err) {
    const payload = { prompt, model: opts?.model || 'gpt-4o-mini', userId: LocalStorageUtil.get('userId') || null }
    return request.post('/api/ai/query', payload)
  }
}

/**
 * 流式接口：后端提供 GET /chat/stream?message=... 返回 Flux<String>
 * 返回 { stream: AsyncGenerator<string>, abort: () => void }
 */
export function aiChatStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, opts?: { model?: string; temperature?: number }) {
  const controller = new AbortController()
  const userContents = messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
  const message = userContents || (messages[0] && messages[0].content) || ''
  const encoded = encodeURIComponent(message)
  const userId = LocalStorageUtil.get('userId') || ''
  const url = (BASE_URL || '') + `/api/ai/chat/stream?message=${encoded}&userId=${encodeURIComponent(userId)}`

  async function* streamGenerator() {
    const token = LocalStorageUtil.get('token')
    const headers: Record<string, string> = { Accept: 'text/event-stream, text/plain, */*' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(url, { method: 'GET', signal: controller.signal, headers })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`AI stream request failed: ${res.status} ${txt}`)
    }
    if (!res.body) throw new Error('Stream not supported by server')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        yield chunk
      }
    } finally {
      reader.releaseLock()
    }
  }

  return { stream: streamGenerator(), abort: () => controller.abort() }
}

// mock
export function mockAiReply(userMsg: string) {
  const lower = userMsg.toLowerCase()
  if (lower.includes('hello') || lower.includes('hi')) return Promise.resolve({ reply: '你好！我能帮你做什么？' })
  if (lower.includes('help')) return Promise.resolve({ reply: '你可以问我关于文章、日记、或试衣功能的问题，我会尽力回答。' })
  return Promise.resolve({ reply: `已收到：${userMsg}` })
}

export default { aiChat, aiQuery, aiChatStream, mockAiReply }
