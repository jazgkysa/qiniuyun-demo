// Groq API: Whisper STT + LLaMA streaming translation
export function useGroq(apiKey) {
  /**
   * Transcribe an audio Blob using Groq Whisper
   * @param {Blob} audioBlob
   * @param {string} language  e.g. 'en', 'ja', 'auto'
   * @returns {Promise<string>}
   */
  async function transcribe(audioBlob, language = 'en') {
    const form = new FormData()
    form.append('file', audioBlob, 'audio.webm')
    form.append('model', 'whisper-large-v3')
    if (language && language !== 'auto') form.append('language', language)
    form.append('response_format', 'json')
 
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Whisper error ${res.status}`)
    }
    const data = await res.json()
    return data.text?.trim() || ''
  }
 
  /**
   * Stream-translate text via Groq LLaMA
   * @param {string} text           source text
   * @param {string} srcLang        e.g. '英语'
   * @param {string} dstLang        e.g. '中文'
   * @param {string[]} history      recent [orig, trans] pairs for context correction
   * @param {(chunk: string) => void} onChunk  called with each streamed token
   * @returns {Promise<string>}     full translated text
   */
  async function translate(text, srcLang, dstLang, history = [], onChunk) {
    const historyContext = history.length
      ? '\n历史上下文（用于修正前序错误）：\n' +
        history.map(h => `${srcLang}: ${h.orig}\n${dstLang}: ${h.trans}`).join('\n')
      : ''
 
    const systemPrompt =
      `你是一名专业同声传译员。将用户发送的${srcLang}文本实时精准翻译为${dstLang}。` +
      `只输出译文，不加任何解释或标点以外的内容。保持语义准确、简洁自然。` +
      historyContext
 
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        stream: true,
        max_tokens: 512,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      })
    })
 
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `LLaMA error ${res.status}`)
    }
 
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
 
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const trimmed = line.replace(/^data: /, '').trim()
        if (!trimmed || trimmed === '[DONE]') continue
        try {
          const json = JSON.parse(trimmed)
          const token = json.choices?.[0]?.delta?.content || ''
          if (token) {
            full += token
            onChunk?.(token)
          }
        } catch {}
      }
    }
    return full
  }
 
  return { transcribe, translate }
}