<template>
  <div class="subtitle-panel" :class="{ active: isListening }">
    <!-- Live indicator -->
    <div class="panel-header">
      <div class="live-badge" :class="{ on: isListening }">
        <span class="live-dot" />
        {{ isListening ? 'LIVE' : '待机' }}
      </div>
      <span class="pair-count">{{ history.length }} 条记录</span>
    </div>

    <!-- Current subtitle -->
    <div class="current-block" ref="currentRef">
      <div class="orig-line" v-if="currentOrig || interimOrig">
        {{ currentOrig || interimOrig }}
        <span class="interim-tag" v-if="!currentOrig && interimOrig">识别中…</span>
      </div>
      <div class="trans-line">
        <span v-if="currentTrans">{{ currentTrans }}</span>
        <span v-else-if="streamingTrans" class="streaming">{{ streamingTrans }}<span class="cursor" /></span>
        <span v-else-if="isListening" class="placeholder">等待语音…</span>
      </div>
    </div>

    <!-- History scroll list -->
    <div class="history-list" ref="historyRef" v-if="history.length">
      <TransitionGroup name="slide">
        <div
          class="history-item"
          v-for="item in reversedHistory"
          :key="item.id"
        >
          <p class="h-orig">{{ item.orig }}</p>
          <p class="h-trans">{{ item.trans }}</p>
        </div>
      </TransitionGroup>
    </div>

    <div class="empty-hint" v-if="!history.length && !isListening">
      <i class="ti ti-ear" />
      <span>点击「开始聆译」后字幕将在此滚动显示</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  isListening: Boolean,
  currentOrig: String,
  interimOrig: String,
  currentTrans: String,
  streamingTrans: String,
  history: { type: Array, default: () => [] }
})

const historyRef = ref(null)
const currentRef = ref(null)

const reversedHistory = computed(() =>
  [...props.history].reverse().slice(0, 20)
)

watch(() => props.history.length, async () => {
  await nextTick()
  if (historyRef.value) {
    historyRef.value.scrollTop = 0
  }
})
</script>

<style scoped>
.subtitle-panel {
  background: #0f0f1a;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  min-height: 200px;
  display: flex; flex-direction: column; gap: 1rem;
  transition: box-shadow 0.3s;
}
.subtitle-panel.active {
  box-shadow: 0 0 0 2px var(--accent), 0 8px 32px rgba(45,107,228,0.15);
}

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
}
.live-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  color: #555; text-transform: uppercase;
  transition: color 0.3s;
}
.live-badge.on { color: #e74c3c; }
.live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: currentColor;
}
.live-badge.on .live-dot { animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(1.5);} }

.pair-count { font-size: 11px; color: #444; }

.current-block {
  min-height: 80px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 1rem;
}
.orig-line {
  font-size: 13px; color: #666; line-height: 1.6;
  margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;
}
.interim-tag {
  font-size: 10px; color: #444;
  background: rgba(255,255,255,0.05);
  border-radius: 4px; padding: 1px 6px;
}
.trans-line {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.2rem; color: #ffffff; line-height: 1.7;
  min-height: 34px;
}
.streaming { color: #fff; }
.cursor {
  display: inline-block; width: 2px; height: 1em;
  background: var(--accent); margin-left: 2px;
  animation: blink 0.9s infinite; vertical-align: text-bottom;
}
@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
.placeholder { color: #333; font-style: italic; font-size: 0.9rem; font-family: 'Inter', sans-serif; }

.history-list {
  overflow-y: auto; max-height: 260px;
  display: flex; flex-direction: column; gap: 0.85rem;
}
.history-item { opacity: 0.7; }
.history-item:first-child { opacity: 0.9; }
.h-orig { font-size: 11.5px; color: #555; margin-bottom: 3px; }
.h-trans { font-family: 'Noto Serif SC', serif; font-size: 14px; color: #bbb; line-height: 1.6; }

.slide-enter-active { transition: all 0.3s ease; }
.slide-enter-from { opacity: 0; transform: translateY(-10px); }

.empty-hint {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  flex: 1; color: #333; font-size: 13px;
}
.empty-hint i { font-size: 20px; }
</style>
