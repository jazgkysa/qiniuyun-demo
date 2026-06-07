import { ref } from 'vue'

// Hallucination phrases commonly produced by Whisper on silence/noise
const HALLUCINATION_PATTERNS = [
  /^(thank you\.?|thanks\.?|bye\.?|goodbye\.?)$/i,
  /字幕.*提供/,
  /subtitles?\s+by/i,
  /amara\.org/i,
  /^\s*\.\s*$/,
  /^(\s*\[.*?\]\s*)+$/  // e.g. [Music] [Applause]
]

function isHallucination(text) {
  return HALLUCINATION_PATTERNS.some(p => p.test(text.trim()))
}

export function useAudio() {
  const isCapturing = ref(false)
  const error = ref('')

  let mediaStream = null
  let audioContext = null
  let mediaRecorder = null
  let chunkTimer = null
  let onChunkCallback = null

  /**
   * Start audio capture
   * @param {'mic'|'system'} mode
   * @param {number} chunkMs  milliseconds per chunk sent for transcription
   * @param {(blob: Blob) => void} onChunk
   */
  async function start(mode, chunkMs = 5000, onChunk) {
    error.value = ''
    onChunkCallback = onChunk

    try {
      if (mode === 'mic') {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
      } else {
        // system audio via getDisplayMedia
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,   // required by some browsers even if unused
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 16000
          }
        })
        // keep only audio tracks, drop video
        const audioTracks = displayStream.getAudioTracks()
        if (!audioTracks.length) {
          displayStream.getTracks().forEach(t => t.stop())
          throw new Error('未检测到音频 — 请在共享对话框中勾选"分享音频"')
        }
        displayStream.getVideoTracks().forEach(t => t.stop())
        mediaStream = new MediaStream(audioTracks)
      }

      // Use Web Audio API for AEC gate (software noise gate)
      audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(mediaStream)
      const dest = audioContext.createMediaStreamDestination()
      source.connect(dest)

      // MediaRecorder on the processed stream
      const mimeType = getSupportedMimeType()
      mediaRecorder = new MediaRecorder(dest.stream, { mimeType })

      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          onChunkCallback?.(e.data)
        }
      }

      mediaRecorder.start()

      // Slice into chunks every `chunkMs` ms
      chunkTimer = setInterval(() => {
        if (mediaRecorder?.state === 'recording') {
          mediaRecorder.requestData()
        }
      }, chunkMs)

      isCapturing.value = true
    } catch (e) {
      error.value = e.message || '无法获取音频权限'
      stop()
    }
  }

  function stop() {
    clearInterval(chunkTimer)
    chunkTimer = null

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    mediaRecorder = null

    if (audioContext) {
      audioContext.close()
      audioContext = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }

    isCapturing.value = false
  }

  function getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4'
    ]
    return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
  }

  return { isCapturing, error, start, stop, isHallucination }
}
