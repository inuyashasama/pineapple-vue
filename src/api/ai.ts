import request from './request'

export async function aiChat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, opts?: { model?: string; temperature?: number }) {
  const payload = {
    messages,
    model: opts?.model || 'gpt-4o-mini',
    temperature: opts?.temperature ?? 0.7,
  }
  return request.post('/api/ai/chat', payload)
}

export async function aiQuery(prompt: string, opts?: { model?: string }) {
  const payload = { prompt, model: opts?.model || 'gpt-4o-mini' }
  return request.post('/api/ai/query', payload)
}


export function aiChatStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, opts?: { model?: string; temperature?: number }) {
  const controller = new AbortController()
  const url = '/api/ai/chat/stream'
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: opts?.model || 'gpt-4o-mini', temperature: opts?.temperature ?? 0.7 }),
    signal: controller.signal,
  }

  async function* streamGenerator() {
    const res = await fetch(url, init)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`AI stream request failed: ${res.status} ${text}`)
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
  // 简单的回显
  return Promise.resolve({ reply: `已收到：${userMsg}` })
}

export default { aiChat, aiQuery, aiChatStream, mockAiReply }
