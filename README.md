<div align="center">

# Content Publisher

**WeChat Publishing Pipeline for Claude Code**

*Article in, WeChat draft out. Images generated, layout styled, signature injected.*

A Claude Code skill that takes a finished `article.md` and produces a WeChat Official Account draft — with AI-generated illustrations, custom CSS themes, and one-command publishing.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://claude.com/claude-code)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f9f1e1?logo=bun)](https://bun.sh)
[![WeChat](https://img.shields.io/badge/WeChat-API-07C160?logo=wechat)](https://mp.weixin.qq.com)

**English** | [简体中文](README_CN.md)

</div>

---

## Why Content Publisher?

Writing the article is only half the job. You still need cover art, illustrations, a styled layout, and a WeChat draft — all before you can hit publish.

### Without Content Publisher:

> 1. Open Midjourney / DALL-E, generate a cover, download, resize to 2.5:1...
> 2. Generate 3-4 section illustrations, pick styles, download each one...
> 3. Copy article into WeChat editor, fight with formatting for 20 minutes...
> 4. Upload images one by one, insert at right positions...
> 5. Preview, fix spacing, preview again...
>
> **Total: 45-60 minutes of manual work per article.** 😤

### With Content Publisher:

> ```text
> publish article.md
> ```
>
> Cover + illustrations generated (56 styles, auto-rotation) → layout applied (17 themes) → signature injected → WeChat draft created → archived → temp files cleaned up. ✅
>
> **Human confirms at each checkpoint. The pipeline handles the rest.**

---

## What You Get

| Feature | Description |
|---------|-------------|
| **Image Generation** | 56 illustration styles with auto-rotation, Gemini API + web-free + CDP fallback |
| **Layout Themes** | 17 custom CSS themes with tone-matched rotation |
| **WeChat Publishing** | HTTP API draft creation with credential and IP whitelist |
| **Signature Inject** | Auto-appends `~/.content-publisher/signature.html` before publishing |
| **Archive & Cleanup** | Archives output, moves temp files to `~/.Trash/` |

---

## Quick Start

```bash
git clone https://github.com/AliceLJY/content-publisher.git
cd content-publisher
bun install
bash scripts/setup.sh
bash scripts/doctor.sh
```

### Configuration

Create `~/.content-publisher/.env`:

```dotenv
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
GOOGLE_API_KEY=your_gemini_key
```

> You must add your machine's outbound IP to the WeChat Official Account platform whitelist, or draft creation will fail with error `40164`.

### Usage

**As a Claude Code Skill:**

```text
publish article.md
```

**As standalone scripts:**

```bash
# Generate an image
bun scripts/gemini-image-gen.ts --prompt "..." --output cover.png --aspect 2.5:1

# Format markdown into styled HTML
bun scripts/format-wechat.ts --input article.md --output styled.html --style wechat-default

# Publish to WeChat draft
bun scripts/publish-wechat.ts article.md --author "Author" --cover cover.png --theme wechat-default

# Check environment
bash scripts/doctor.sh
```

---

## Pipeline

```
  content-alchemy (upstream)             content-publisher (this repo)
  ──────────────────────────             ────────────────────────────

  Stage 1-5: Research & Writing    ───►  article.md
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Image Generation │  56 styles
                                     │ (Gemini API/CDP) │  auto-rotation
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Layout Styling  │  17 CSS themes
                                     │  (format-wechat) │  tone-matched
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ WeChat Publish   │  API draft
                                     │ + Signature      │  + IP whitelist
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Archive + Clean  │  ~/Desktop/article-archive/
                                     │                  │  temp → ~/.Trash/
                                     └─────────────────┘
```

---

## Ecosystem

| Repo | Role |
|------|------|
| [content-alchemy](https://github.com/AliceLJY/content-alchemy) | Upstream research and writing (Stages 1-5) |
| **content-publisher** (this repo) | Images, layout, publishing, archive, cleanup |
| [recallnest](https://github.com/AliceLJY/recallnest) | Shared memory layer for Claude Code, Codex, Gemini CLI |
| [openclaw-tunnel](https://github.com/AliceLJY/openclaw-tunnel) | Docker-to-host tunnel for `/cc`, `/codex`, `/gemini` |
| [digital-clone-skill](https://github.com/AliceLJY/digital-clone-skill) | Build digital clones from corpus data |
| [cc-shell](https://github.com/AliceLJY/cc-shell) | Lightweight Claude Code chat UI |
| [telegram-ai-bridge](https://github.com/AliceLJY/telegram-ai-bridge) | Telegram bots for Claude, Codex, and Gemini |
| [telegram-cli-bridge](https://github.com/AliceLJY/telegram-cli-bridge) | Telegram CLI bridge for Gemini CLI |

---

<details>
<summary><strong>Project Structure</strong></summary>

```text
content-publisher/
├── README.md
├── README_CN.md
├── SKILL.md
├── layout-style-catalog.md
├── references/
│   ├── image-generation.md
│   ├── layout-themes.md
│   ├── publishing.md
│   └── style-catalog.md
├── scripts/
│   ├── cdp.ts
│   ├── doctor.sh
│   ├── format-wechat.ts
│   ├── gemini-image-gen.ts
│   ├── generate-layout-themes.ts
│   ├── publish-wechat.ts
│   ├── publish.sh
│   ├── setup.sh
│   ├── simple-md-to-html.ts
│   └── themes/
└── assets/
    └── wechat_qr.jpg
```

</details>

<details>
<summary><strong>Prerequisites & Environment</strong></summary>

**Required:**
- Claude Code
- Bun
- A finished `article.md`
- A WeChat Official Account with API access
- Official Account outbound IP whitelist configured

**Configuration files:**
- Env file: `~/.content-publisher/.env`
- Signature file: `~/.content-publisher/signature.html` (optional, auto-appended)

**Local path assumptions (may need adjustment):**
- WeChat asset directory: `~/Desktop/wechat_assets/`
- Article archive: `~/Desktop/article-archive/`
- Image style history: `~/.openclaw-antigravity/workspace/images/style-history.txt`
- Layout style history: `~/.openclaw-antigravity/workspace/images/layout-style-history.txt`
- Cleanup target: `~/.Trash/`
- Chrome app path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

**Compatibility:**
- Tested on macOS with the author's Claude Code CLI workflow
- Not guaranteed on Linux or Windows
- `scripts/cdp.ts` includes Windows/Linux Chrome path candidates but cross-platform is not officially supported

</details>

---

## Acknowledgments

Originally built on top of [baoyu-skills](https://github.com/JimLiu/baoyu-skills) by Jim Liu. The WeChat publishing pipeline, theme system, and markdown rendering approach were inspired by baoyu's work, while this repository now uses its own local scripts and workflow.

## Author

Built by **小试AI** ([@AliceLJY](https://github.com/AliceLJY)) for the WeChat public account **我的AI小木屋**.

Six content pillars: **Hands-on AI**, **AI Pitfall Diaries**, **AI and Humanity**, **AI Cold Eye**, **AI Musings**, and **AI Visual Notes**.

<img src="./assets/wechat_qr.jpg" width="200" alt="WeChat QR Code">

## License

MIT
