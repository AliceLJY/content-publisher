# Content Publisher

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Image generation, layout formatting, and WeChat Official Account publishing pipeline. Takes a finished `article.md` and produces a WeChat draft with images and styled layout.

> 配图生成、排版格式化、微信公众号发布流水线。接收 content-alchemy 产出的 article.md，输出微信草稿。

## Features

| Feature | Description |
|---------|-------------|
| Image Generation | 56 illustration styles with auto-rotation, Gemini API + CDP fallback |
| Layout Themes | 17 custom CSS themes with tone-matched auto-rotation |
| WeChat Publishing | Pure HTTP API mode — headless, no Chrome needed |
| Signature Auto-Inject | Reads `~/.content-publisher/signature.html`, appends before draft creation |
| Archive & Cleanup | Auto-archive to article store, trash temp files |

> 56 种配图风格自动轮换 + 17 套排版主题自动匹配 + 微信 API 一键发布 + 签名自动注入。

## Prerequisites

- [Bun](https://bun.sh/) runtime
- macOS (for `sips` image processing and Chrome CDP)
- Chrome 144+ (for browser mode fallback)
- A finished `article.md` — from [content-alchemy](https://github.com/AliceLJY/content-alchemy) or handwritten

> 需要 Bun 运行时、macOS 环境。输入为写好的 article.md 文件。

## Setup

```bash
git clone https://github.com/AliceLJY/content-publisher.git
cd content-publisher
bun install
bash scripts/setup.sh
bash scripts/doctor.sh   # verify environment
```

### API Mode Config (recommended)

Create `~/.content-publisher/.env`:
```
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
GOOGLE_API_KEY=your_gemini_key
```

Add your machine's outbound IP to the WeChat Official Account platform IP whitelist (Settings > Development > Basic Config).

> 需要在微信公众平台「设置与开发 → 基本配置 → IP白名单」添加你的出口 IP。

### Signature (optional)

Create `~/.content-publisher/signature.html` with your custom signature block. The script auto-appends it to every published article.

> 签名档放在 `~/.content-publisher/signature.html`，发布时自动追加到文末。

## Usage

### As a Claude Code Skill

```
publish article.md
```

The skill handles image generation, layout selection, and WeChat draft creation with user checkpoints.

> 一句话搞定：自动配图 → 选排版 → 发微信草稿，每步都有确认点。

### Scripts

```bash
# Generate an image (56 styles, Gemini API)
bun scripts/gemini-image-gen.ts --prompt "..." --output cover.png --aspect 2.5:1

# Format markdown → styled HTML (17 themes)
bun scripts/format-wechat.ts --input article.md --output styled.html --style wechat-anthropic

# Publish to WeChat (pure HTTP, no browser)
bun scripts/publish-wechat.ts article.md --author "小试AI" --cover cover.png --theme vibecoding-tech

# Check environment
bash scripts/doctor.sh
```

## Structure

```
content-publisher/
├── SKILL.md                          # Skill definition
├── scripts/
│   ├── gemini-image-gen.ts           # 56-style image generation (Gemini API + CDP)
│   ├── format-wechat.ts             # Markdown → styled HTML (17 built-in themes)
│   ├── publish-wechat.ts            # WeChat API publishing + signature injection
│   ├── simple-md-to-html.ts         # Lightweight MD→HTML converter
│   ├── generate-layout-themes.ts    # Theme CSS generator
│   ├── cdp.ts                       # Chrome DevTools Protocol helper
│   └── themes/                      # Generated CSS files (17 themes)
├── references/
│   ├── image-generation.md          # Style rotation + tool priority
│   ├── layout-themes.md             # Theme catalog + rotation logic
│   └── publishing.md                # API mode + signature + troubleshooting
└── assets/
    └── wechat_qr.jpg               # Author's WeChat QR code
```

## Ecosystem

| Repo | Role |
|------|------|
| [content-alchemy](https://github.com/AliceLJY/content-alchemy) | Upstream: research + writing (Stages 1-5) |
| **content-publisher** (this) | Downstream: images + layout + publishing + cleanup |
| [digital-clone-skill](https://github.com/AliceLJY/digital-clone-skill) | Writing DNA extraction for personalized style |
| [openclaw-content-alchemy](https://github.com/AliceLJY/openclaw-content-alchemy) | Standard edition: bot config + 56 art styles |

> content-alchemy 产出 article.md → content-publisher 配图排版发布。两个仓库各司其职。

## Acknowledgments

This project was originally built on top of [baoyu-skills](https://github.com/JimLiu/baoyu-skills) by Jim Liu. The WeChat publishing pipeline, theme system, and markdown rendering approach were all inspired by baoyu's work. While content-publisher now uses its own self-contained implementations, we stand on the shoulders of giants.

> 感谢 Jim Liu 的 baoyu-skills 项目。微信发布、主题系统、Markdown 渲染的灵感都来源于此。现已完全自包含，不再依赖 submodule。

## Author

Built by **小试AI** ([@AliceLJY](https://github.com/AliceLJY)) · WeChat: **我的AI小木屋**

> 医学出身，文化口工作，AI 野路子。公众号六大板块：AI实操手账 · AI踩坑实录 · AI照见众生 · AI冷眼旁观 · AI胡思乱想 · AI视觉笔记

Six content pillars: **Hands-on AI** · **AI Pitfall Diaries** · **AI & Humanity** · **AI Cold Eye** · **AI Musings** · **AI Visual Notes**

<img src="./assets/wechat_qr.jpg" width="200" alt="WeChat QR Code — 我的AI小木屋">

---

## License

MIT
