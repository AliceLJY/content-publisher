# Content Publisher

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Image generation, layout formatting, and WeChat Official Account publishing pipeline.

> 配图生成、排版格式化、微信公众号发布流水线。接收 content-alchemy 产出的 article.md，输出微信草稿。

## Features

| Feature | Description |
|---------|-------------|
| Image Generation | 56 illustration styles with auto-rotation, Gemini API + CDP fallback |
| Layout Themes | 17 custom themes with tone-matched auto-rotation |
| WeChat Publishing | API mode (headless) + browser mode (fallback) |
| Archive & Cleanup | Auto-archive to article store, trash temp files |

## Prerequisites

- [Bun](https://bun.sh/) runtime
- macOS (for `sips` image processing and Chrome CDP)
- Chrome 144+ (for browser mode fallback)
- A finished `article.md` — from [content-alchemy](https://github.com/AliceLJY/content-alchemy) or handwritten

> 需要 Bun 运行时、macOS 环境、Chrome 144+。输入为写好的 article.md 文件。

### API Mode (recommended)

Create `~/.content-publisher/.env`:
```
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
GOOGLE_API_KEY=your_gemini_key
```

Add your machine's outbound IP to the WeChat Official Account platform IP whitelist.

## Setup

```bash
git clone https://github.com/AliceLJY/content-publisher.git
cd content-publisher
bun install
bash scripts/setup.sh
bash scripts/doctor.sh   # verify environment
```

## Usage

### As a Claude Code Skill

```
publish article.md
```

The skill handles image generation, layout selection, and WeChat draft creation with user checkpoints.

### Scripts

```bash
# Generate an image
bun scripts/gemini-image-gen.ts --prompt "A red apple" --output cover.png --aspect 2.5:1

# Format markdown to styled HTML
bun scripts/format-wechat.ts --input article.md --output styled.html --style wechat-anthropic

# Convert markdown to HTML with image placeholders
bun scripts/simple-md-to-html.ts article.md

# Publish via browser mode
bash scripts/publish.sh article.md
```

## Ecosystem

| Project | Role |
|---------|------|
| [content-alchemy](https://github.com/AliceLJY/content-alchemy) | Upstream: research, writing, editing (Stages 1-5) |
| **content-publisher** (this repo) | Downstream: images, layout, publishing, cleanup |

## Acknowledgments

This project was originally built on top of [baoyu-skills](https://github.com/JimLiu/baoyu-skills) by Jim Liu. The WeChat publishing pipeline, theme system, and markdown rendering approach were all inspired by baoyu's work. While content-publisher now uses its own implementations (`publish-wechat.ts`, `format-wechat.ts`), we stand on the shoulders of giants.

## License

MIT
