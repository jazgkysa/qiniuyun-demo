import { ref } from 'vue'

export function useTTS() {
  const enabled = ref(false)
  const speaking = ref(false)

  let queue = []
  let isSpeaking = false
  let targetLang = 'zh'

  const langMap = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE'
  }

  function setTargetLang(lang) {
    targetLang = lang
  }

  function speak(text) {
    if (!enabled.value || !text?.trim()) return
    queue.push(text)
    if (!isSpeaking) processQueue()
  }

  function processQueue() {
    if (!queue.length) {
      isSpeaking = false
      speaking.value = false
      return
    }
    isSpeaking = true
    speaking.value = true
    const text = queue.shift()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = langMap[targetLang] || 'zh-CN'
    utter.rate = 1.05
    utter.onend = () => processQueue()
    utter.onerror = () => processQueue()
    window.speechSynthesis.speak(utter)
  }

  function pause() {
    window.speechSynthesis.pause()
  }

  function resume() {
    window.speechSynthesis.resume()
  }

  function cancel() {
    queue = []
    window.speechSynthesis.cancel()
    isSpeaking = false
    speaking.value = false
  }

  function toggle() {
    enabled.value = !enabled.value
    if (!enabled.value) cancel()
  }

  return { enabled, speaking, toggle, speak, pause, resume, cancel, setTargetLang }
}
