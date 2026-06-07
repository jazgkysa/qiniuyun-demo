<template>
  <div class="app">

    <!-- ── HEADER ── -->
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          <i class="ti ti-language" />
          <span>AI 同声传译</span>
        </div>
        <div class="header-right">
          <div class="api-status" :class="apiKey ? 'has-key' : 'no-key'" @click="showModal = true">
            <i :class="apiKey ? 'ti ti-circle-check' : 'ti ti-key'" />
            {{ apiKey ? 'Groq 已接入' : '配置 API Key' }}
          </div>
          <button class="icon-btn" @click="showModal = true" title="API Key 设置">
            <i class="ti ti-settings" />
          </button>
        </div>
      </div>
    </header>

    <!-- ── HERO ── -->
    <section class="hero">
      <div class="badge"><span class="badge-dot" />AI 实时传译</div>
      <h1>打破语言边界<br /><span class="accent-text">同声传译</span>，即说即译</h1>
      <p class="hero-sub">麦克风 · 系统音频双模式 &nbsp;|&nbsp; 双语互译<br />流式字幕 · 上下文纠错 · 语音播报</p>
    </section>

    <!-- ── MAIN PANEL ── -->
    <main class="main">

      <!-- Input mode -->
      <div class="section">
        <div class="section-label">输入模式</div>
        <div class="mode-grid">
          <button
            v-for="m in modes" :key="m.id"
            class="mode-btn"
            :class="{ active: inputMode === m.id }"
            :disabled="isListening"
            @click="inputMode = m.id"
          >
            <div class="mode-check" v-if="inputMode === m.id"><i class="ti ti-check" /></div>
            <i :class="`ti ${m.icon}`" class="mode-icon" />
            <strong>{{ m.label }}</strong>
            <small>{{ m.desc }}</small>
          </button>
        </div>
      </div>

      <!-- Language -->
      <div class="section">
        <div class="section-label">语言设置</div>
        <div class="lang-row">
          <select v-model="srcLang" :disabled="isListening" class="lang-select">
            <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.flag }} {{ l.name }}</option>
          </select>
          <button class="swap-btn" :disabled="isListening" @click="swapLangs" title="交换语言">
            <i class="ti ti-arrows-exchange" />
          </button>
          <select v-model="dstLang" :disabled="isListening" class="lang-select">
            <option v-for="l in languages.filter(l=>l.code!=='auto')" :key="l.code" :value="l.code">{{ l.flag }} {{ l.name }}</option>
          </select>
        </div>
      </div>

      <!-- TTS -->
      <div class="section">
        <div class="section-label">语音播报</div>
        <div class="tts-row" @click="tts.toggle()" role="switch" :aria-checked="tts.enabled.value">
          <div class="tts-left">
            <i :class="tts.enabled.value ? 'ti ti-volume' : 'ti ti-volume-off'" class="tts-icon" />
            <div>
              <p class="tts-title">语音播报 (TTS)</p>
              <small class="tts-desc">{{ tts.enabled.value ? '开启 — 译文自动朗读' : '关闭 — 仅显示字幕' }}</small>
            </div>
          </div>
          <div class="toggle" :class="{ on: tts.enabled.value }" />
        </div>
      </div>

      <!-- Start button -->
      <button class="start-btn" :class="{ listening: isListening }" @click="toggleListen">
        <i :class="isListening ? 'ti ti-player-stop' : 'ti ti-ear'" />
        {{ isListening ? '停止聆译' : '开始聆译' }}
      </button>

      <!-- Error -->
      <div class="error-bar" v-if="audioError || translateError">
        <i class="ti ti-alert-circle" />
        {{ audioError || translateError }}
      </div>

      <!-- Subtitle panel -->
      <SubtitlePanel
        :isListening="isListening"
        :currentOrig="currentOrig"
        :interimOrig="interimOrig"
        :currentTrans="currentTrans"
        :streamingTrans="streamingTrans"
        :history="history"
        class="subtitle-section"
      />

      <!-- Feature chips -->
      <div class="features">
        <div class="feat" v-for="f in features" :key="f.label">
          <i :class="`ti ${f.icon}`" />
          <span>{{ f.label }}</span>
        </div>
      </div>
    </main>

    <!-- API Key Modal -->
    <ApiKeyModal
      v-if="showModal"
      v-model="apiKey"
      @close="showModal = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import SubtitlePanel from './components/SubtitlePanel.vue'
import ApiKeyModal from './components/ApiKeyModal.vue'
import { useAudio } from './composables/useAudio.js'
import { useGroq } from './composables/useGroq.js'
import { useTTS } from './composables/useTTS.js'
import { useWebSpeech } from './composables/useWebSpeech.js'

// ── State ──────────────────────────────────────────────
const apiKey = ref(localStorage.getItem('groq_api_key') || '')
const showModal = ref(false)
const inputMode = ref('mic')
const srcLang = ref('en')
const dstLang = ref('zh')
const isListening = ref(false)
const translateError = ref('')

// Subtitle state
const currentOrig = ref('')
const interimOrig = ref('')
const currentTrans = ref('')
const streamingTrans = ref('')
const history = ref([])  // { id, orig, trans }

// ── Persist API key ────────────────────────────────────
watch(apiKey, v => {
  if (v) localStorage.setItem('groq_api_key', v)
  else localStorage.removeItem('groq_api_key')
})

// ── Composables ────────────────────────────────────────
const audio = useAudio()
const tts = useTTS()
const webSpeech = useWebSpeech()

const audioError = audio.error

// keep TTS target lang in sync
watch(dstLang, v => tts.setTargetLang(v), { immediate: true })

// ── Data ───────────────────────────────────────────────
const modes = [
  { id: 'mic',    icon: 'ti-microphone',    label: '麦克风模式',   desc: '捕获麦克风输入，实时识别翻译' },
  { id: 'system', icon: 'ti-device-desktop', label: '系统音频模式', desc: '翻译会议、视频、标签页音频' }
]

const languages = [
  { code: 'auto', name: '自动检测', flag: '🌐' },
  { code: 'en',   name: '英语',     flag: '🇺🇸' },
  { code: 'zh',   name: '中文',     flag: '🇨🇳' },
 
]

const features = [
  { icon: 'ti-bolt',        label: '流式字幕' },
  { icon: 'ti-refresh',     label: '上下文纠错' },
  { icon: 'ti-ban',         label: '幻觉过滤' },
  { icon: 'ti-headphones',  label: '回声抑制' },
  { icon: 'ti-language',    label: '多种语言' },
]

const langNames = { en:'英语', zh:'中文', auto:'自动' }

// ── Helpers ────────────────────────────────────────────
function swapLangs() {
  if (srcLang.value === 'auto') return
  const tmp = srcLang.value
  srcLang.value = dstLang.value
  dstLang.value = tmp
}

let historyCounter = 0
function pushHistory(orig, trans) {
  history.value.push({ id: ++historyCounter, orig, trans })
  if (history.value.length > 30) history.value.shift()
}

function getRecentContext(n = 5) {
  return history.value.slice(-n)
}

// ── Groq mode pipeline ─────────────────────────────────
async function handleAudioChunk(blob) {
  if (!apiKey.value) return
  translateError.value = ''

  const groq = useGroq(apiKey.value)

  let origText = ''
  try {
    origText = await groq.transcribe(blob, srcLang.value === 'auto' ? undefined : srcLang.value)
  } catch (e) {
    translateError.value = 'STT 错误: ' + e.message
    return
  }

  if (!origText || audio.isHallucination(origText)) return

  currentOrig.value = origText
  currentTrans.value = ''
  streamingTrans.value = ''

  const ctx = getRecentContext()
  try {
    const full = await groq.translate(
      origText,
      langNames[srcLang.value] || srcLang.value,
      langNames[dstLang.value] || dstLang.value,
      ctx,
      token => { streamingTrans.value += token }
    )
    streamingTrans.value = ''
    currentTrans.value = full
    pushHistory(origText, full)
    tts.speak(full)
  } catch (e) {
    translateError.value = '翻译错误: ' + e.message
  }
}

// ── Web Speech mode pipeline ───────────────────────────
function startWebSpeech() {
  webSpeech.start(
    srcLang.value,
    async (interim, final) => {
      if (interim) interimOrig.value = interim
      if (final && final.trim()) {
        interimOrig.value = ''
        currentOrig.value = final
        currentTrans.value = ''
        streamingTrans.value = '翻译中…'
        const trans = await webSpeech.translateFree(final, srcLang.value, dstLang.value)
        streamingTrans.value = ''
        currentTrans.value = trans
        pushHistory(final, trans)
        tts.speak(trans)
      }
    },
    () => {
      // auto-restart on end if still listening
      if (isListening.value) startWebSpeech()
    }
  )
}

// ── Toggle ─────────────────────────────────────────────
async function toggleListen() {
  if (isListening.value) {
    // stop
    audio.stop()
    webSpeech.stop()
    tts.cancel()
    isListening.value = false
    currentOrig.value = ''
    interimOrig.value = ''
    currentTrans.value = ''
    streamingTrans.value = ''
    return
  }

  translateError.value = ''
  isListening.value = true

  if (apiKey.value) {
    // Groq mode: audio chunks → Whisper → LLaMA
    await audio.start(inputMode.value, 6000, handleAudioChunk)
    if (!audio.isCapturing.value) {
      isListening.value = false
    }
  } else {
    // Fallback: Web Speech API
    if (!webSpeech.isSupported.value) {
      translateError.value = '当前浏览器不支持 Web Speech API，请配置 Groq API Key'
      isListening.value = false
      return
    }
    startWebSpeech()
  }
}

onUnmounted(() => {
  audio.stop()
  webSpeech.stop()
  tts.cancel()
})
</script>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }

/* Header */
.header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(248,247,244,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  max-width: 680px; margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between;
}
.logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; color: var(--ink);
}
.logo i { font-size: 20px; color: var(--accent); }
.header-right { display: flex; align-items: center; gap: 8px; }
.api-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; padding: 5px 10px;
  border-radius: 999px; cursor: pointer;
  border: 1px solid; transition: all 0.15s;
}
.api-status.has-key { color: var(--green); border-color: rgba(26,122,74,0.3); background: var(--green-soft,#e3f5ec); }
.api-status.no-key  { color: var(--ink3); border-color: var(--border2); background: var(--card2); }
.api-status:hover { border-color: var(--accent); color: var(--accent); }
.icon-btn {
  width: 34px; height: 34px; border-radius: 9px;
  border: 1px solid var(--border2); background: var(--card2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink2); font-size: 17px; transition: all 0.15s;
}
.icon-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }

/* Hero */
.hero {
  padding: 3rem 1.5rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, #eef2ff 0%, var(--surface) 100%);
  border-bottom: 1px solid var(--border);
}
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent-soft); color: var(--accent2);
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  padding: 5px 13px; border-radius: 999px;
  border: 1px solid rgba(45,107,228,0.2); margin-bottom: 1.25rem;
}
.badge-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(1.5);} }
h1 {
  font-family: 'Noto Serif SC', serif;
  font-size: 2.2rem; font-weight: 600; line-height: 1.3;
  color: var(--ink); margin-bottom: 0.75rem;
}
.accent-text { color: var(--accent); }
.hero-sub { font-size: 13px; color: var(--ink2); line-height: 1.8; }

/* Main */
.main {
  max-width: 680px; width: 100%;
  margin: 0 auto; padding: 2rem 1.5rem 3rem;
  display: flex; flex-direction: column; gap: 1.5rem;
}
.section-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--ink3); margin-bottom: 0.75rem;
}

/* Mode grid */
.mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mode-btn {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 1.1rem 1rem;
  border-radius: var(--radius);
  border: 1.5px solid var(--border2); background: var(--card2);
  cursor: pointer; transition: all 0.15s; text-align: center;
}
.mode-btn:not(:disabled):hover { border-color: var(--accent); background: #f0f4ff; }
.mode-btn.active { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 3px rgba(45,107,228,0.1); }
.mode-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mode-icon { font-size: 26px; color: var(--ink2); }
.mode-btn.active .mode-icon { color: var(--accent); }
.mode-btn strong { font-size: 12.5px; color: var(--ink); }
.mode-btn small { font-size: 11px; color: var(--ink3); line-height: 1.5; }
.mode-check {
  position: absolute; top: 8px; right: 8px;
  width: 17px; height: 17px; border-radius: 50%;
  background: var(--accent);
  display: flex; align-items: center; justify-content: center;
}
.mode-check i { font-size: 10px; color: #fff; }

/* Lang row */
.lang-row { display: grid; grid-template-columns: 1fr 38px 1fr; gap: 8px; align-items: center; }
.lang-select {
  width: 100%; padding: 9px 30px 9px 12px;
  border-radius: var(--radius); border: 1px solid var(--border2);
  background: var(--card2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none; font-size: 13px; color: var(--ink);
  cursor: pointer; outline: none; transition: border-color 0.15s;
}
.lang-select:focus { border-color: var(--accent); }
.lang-select:disabled { opacity: 0.5; cursor: not-allowed; }
.swap-btn {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid var(--border2); background: var(--card2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink3); font-size: 17px; transition: all 0.15s;
}
.swap-btn:hover:not(:disabled) { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
.swap-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* TTS */
.tts-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.9rem 1rem; border-radius: var(--radius);
  border: 1px solid var(--border); background: var(--card2);
  cursor: pointer; transition: border-color 0.15s;
}
.tts-row:hover { border-color: var(--accent); }
.tts-left { display: flex; align-items: center; gap: 10px; }
.tts-icon { font-size: 22px; color: var(--ink2); }
.tts-title { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.tts-desc { font-size: 11.5px; color: var(--ink3); }
.toggle {
  width: 42px; height: 23px; border-radius: 999px;
  background: #ddd; position: relative; transition: background 0.2s; flex-shrink: 0;
}
.toggle.on { background: var(--accent); }
.toggle::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 17px; height: 17px; border-radius: 50%;
  background: #fff; transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.toggle.on::after { transform: translateX(19px); }

/* Start button */
.start-btn {
  width: 100%; padding: 1rem 1.5rem;
  border-radius: var(--radius); border: none;
  background: var(--accent); color: #fff;
  font-size: 15px; font-weight: 700; letter-spacing: 0.03em;
  cursor: pointer; transition: all 0.18s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.start-btn i { font-size: 20px; }
.start-btn:hover { background: var(--accent2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,107,228,0.3); }
.start-btn.listening { background: #e74c3c; animation: glow 1.5s infinite; }
@keyframes glow { 0%,100%{box-shadow:0 4px 16px rgba(231,76,60,.3);} 50%{box-shadow:0 4px 28px rgba(231,76,60,.6);} }

/* Error */
.error-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 0.75rem 1rem; border-radius: var(--radius);
  background: #fdecea; border: 1px solid rgba(192,57,43,0.2);
  color: #c0392b; font-size: 13px;
}

.subtitle-section { /* spacing handled by gap */ }

/* Features */
.features {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.feat {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--card);
  font-size: 12px; color: var(--ink2);
}
.feat i { font-size: 14px; color: var(--accent); }
</style>
