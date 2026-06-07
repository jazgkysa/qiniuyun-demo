# AI 同声传译助手

实时语音识别 + AI 翻译，支持麦克风和系统音频双模式。

## 技术栈

| 模块 | 技术 |
|------|------|
| 框架 | Vue 3 + Vite |
| 语音识别 (STT) | Groq API · `whisper-large-v3` |
| AI 翻译 | Groq API · `llama-3.3-70b-versatile` · SSE 流式输出 |
| 音频采集 | `getUserMedia` / `getDisplayMedia` + Web Audio API |
| 语音合成 (TTS) | Web Speech Synthesis API（浏览器原生）|
| 降级模式 | Web Speech API + Google Translate（无需 API Key）|

## 功能特性

- 🎙️ **麦克风模式** — 捕获麦克风输入，实时识别翻译
- 🖥️ **系统音频模式** — `getDisplayMedia` 捕获标签页/窗口音频，适合翻译会议、视频
- 🌐 **双语互译** — 中文、英文
- ⚡ **流式字幕** — 翻译结果逐字流出，低延迟实时展示
- 🔊 **语音播报 (TTS)** — 译文逐句朗读；可按需开启/关闭
- 🎧 **回声抑制** — 硬件 AEC + 软件门控，防止麦克风拾取扬声器声音
- 🚫 **幻觉过滤** — 自动过滤 Whisper 常见幻觉短语（含中文视频水印类文本）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```
#网络环境
1.因为内接openai需要借助vpn不然会出现中译中、英译英的现象
2.用户只使用麦克风下无需配置api

## 配置 Groq API Key

1. 访问 [https://console.groq.com/keys](https://console.groq.com/keys) 获取免费 API Key
2. 点击应用右上角「配置 API Key」
3. 填入 Key 并保存（本地存储，不上传服务器）

**不配置 API Key** 时，自动降级为浏览器内置 Web Speech API + Google Translate，无需任何账号即可使用基础功能。

## 系统音频模式说明

使用系统音频模式时，浏览器会弹出屏幕共享对话框，**必须勾选「分享音频」选项**，否则无法捕获声音。

推荐使用 Chrome 或 Edge 浏览器以获得最佳兼容性。

本项目全程用vibe coding欢迎大家指正
