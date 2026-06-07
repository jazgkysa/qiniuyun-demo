import { ref } from 'vue'

// Fallback mode: browser-native SpeechRecognition + Google Translate link
// Used when no Groq API key is provided
export function useWebSpeech() {
  const isSupported = ref(
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )

  let recognition = null

  const langMap = {
    en: 'en-US',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    auto: 'en-US'
  }

  /**
   * Start Web Speech recognition
   * @param {string} srcLang
   * @param {(interim: string, final: string) => void} onResult
   * @param {() => void} onEnd
   */
  function start(srcLang, onResult, onEnd) {
    if (!isSupported.value) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SR()
    recognition.lang = langMap[srcLang] || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = e => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      onResult(interim, final)
    }

    recognition.onend = () => onEnd?.()
    recognition.onerror = e => {
      if (e.error !== 'no-speech') onEnd?.()
    }

    recognition.start()
  }

  function stop() {
    recognition?.stop()
    recognition = null
  }

  /**
   * Naive client-side translation via window.fetch to a free endpoint.
   * Falls back to a placeholder when unavailable.
   */
  async function translateFree(text, src, dst) {
    try {
      const sl = src === 'auto' ? 'auto' : src
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${dst}&dt=t&q=${encodeURIComponent(text)}`
      const res = await fetch(url)
      const data = await res.json()
      return data[0].map(d => d[0]).join('')
    } catch {
      return `[${text}]` // fallback: show original
    }
  }

  return { isSupported, start, stop, translateFree }
}
