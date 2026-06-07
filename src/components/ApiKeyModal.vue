<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h3>Groq API Key 设置</h3>
          <button class="icon-btn" @click="$emit('close')">
            <i class="ti ti-x" />
          </button>
        </div>

        <p class="modal-desc">
          填写 Groq API Key 后将使用
          <code>whisper-large-v3</code> 识别 +
          <code>llama-3.3-70b-versatile</code> 流式翻译，获得更高精度。<br />
          不填则使用浏览器内置语音识别（免费，精度较低）。
        </p>

        <div class="field">
          <label>API Key</label>
          <div class="input-wrap">
            <input
              v-model="localKey"
              :type="show ? 'text' : 'password'"
              placeholder="gsk_..."
              autocomplete="off"
              spellcheck="false"
            />
            <button class="eye-btn" @click="show = !show">
              <i :class="show ? 'ti ti-eye-off' : 'ti ti-eye'" />
            </button>
          </div>
        </div>

        <a href="https://console.groq.com/keys" target="_blank" class="get-key-link">
          <i class="ti ti-external-link" /> 获取免费 Groq API Key
        </a>

        <div class="modal-actions">
          <button class="btn-ghost" @click="clear">清除</button>
          <button class="btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue', 'close'])

const localKey = ref(props.modelValue || '')
const show = ref(false)

watch(() => props.modelValue, v => { localKey.value = v || '' })

function save() {
  emit('update:modelValue', localKey.value.trim())
  emit('close')
}
function clear() {
  localKey.value = ''
  emit('update:modelValue', '')
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  width: 100%; max-width: 440px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.9rem;
}
.modal-header h3 { font-size: 1rem; font-weight: 700; color: var(--ink); }
.icon-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--border2); background: var(--card2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink2); transition: all 0.15s;
}
.icon-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
.modal-desc {
  font-size: 12.5px; color: var(--ink2); line-height: 1.7;
  margin-bottom: 1.25rem;
}
code {
  background: var(--card2); padding: 1px 5px; border-radius: 4px;
  font-size: 11px; border: 1px solid var(--border);
}
.field label {
  display: block; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink3); margin-bottom: 6px;
}
.input-wrap {
  position: relative;
}
.input-wrap input {
  width: 100%; padding: 10px 40px 10px 12px;
  border-radius: var(--radius); border: 1px solid var(--border2);
  background: var(--card2); font-size: 13px; color: var(--ink);
  outline: none; transition: border-color 0.15s;
}
.input-wrap input:focus { border-color: var(--accent); }
.eye-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--ink3); font-size: 16px; display: flex; align-items: center;
}
.get-key-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--accent); text-decoration: none;
  margin-top: 0.6rem; margin-bottom: 1.25rem;
}
.get-key-link:hover { text-decoration: underline; }
.modal-actions {
  display: flex; gap: 8px; justify-content: flex-end;
}
.btn-ghost {
  padding: 8px 18px; border-radius: var(--radius);
  border: 1px solid var(--border2); background: var(--card2);
  font-size: 13px; font-weight: 600; cursor: pointer;
  color: var(--ink2); transition: all 0.15s;
}
.btn-ghost:hover { border-color: var(--red); color: var(--red); }
.btn-primary {
  padding: 8px 22px; border-radius: var(--radius);
  border: none; background: var(--accent);
  font-size: 13px; font-weight: 700; cursor: pointer;
  color: #fff; transition: background 0.15s;
}
.btn-primary:hover { background: var(--accent2); }
</style>
