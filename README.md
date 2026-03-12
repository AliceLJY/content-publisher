# Content Publisher

**English** | [简体中文](README_CN.md)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Image generation, layout formatting, and WeChat Official Account publishing pipeline. It takes a finished `article.md` and produces a WeChat draft with images and styled layout.

## Tested Environment

- Full workflow is tested only in the author's personal macOS setup.
- The repository is used as a Claude Code skill plus Bun scripts workflow, not as a standalone desktop app.
- macOS
- Claude Code CLI workflow
- Bun
- WeChat Official Account API publishing
- Local article assets and history directories on the author's machine

## Compatibility Notes

- Full workflow is tested only on the author's own macOS setup.
- Some helper scripts assume macOS tools and paths.
- Windows and Linux may partially work, but are not officially tested by the author.
- `scripts/cdp.ts` includes Windows and Linux Chrome path candidates, but this repository is not documented as a cross-platform product.
- WeChat publishing also depends on your own Official Account credentials and IP whitelist.

## Prerequisites

- Claude Code
- Bun
- A finished `article.md`
- A WeChat Official Account with API access
- Official Account outbound IP whitelist configuration
- A local `~/.content-publisher/.env`
- Optional Chrome remote debugging access for CDP fallback
- Optional local persona, style, and archive directories if you want the same workflow quality

## Configuration

Create `~/.content-publisher/.env`:

```dotenv
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
GOOGLE_API_KEY=your_gemini_key
```

Required configuration details:

- `WECHAT_APP_ID` and `WECHAT_APP_SECRET` are used by [`scripts/publish-wechat.ts`](scripts/publish-wechat.ts) for WeChat draft publishing.
- `GOOGLE_API_KEY` is used by [`scripts/gemini-image-gen.ts`](scripts/gemini-image-gen.ts) for Gemini API image generation.
- Add your machine's outbound IP to the WeChat Official Account platform whitelist, or draft creation will fail.
- Create `~/.content-publisher/signature.html` if you want the signature block auto-appended before publishing.
- Chrome remote debugging on port `9222` is optional, but used by the CDP fallback path.

## Local Assumptions

- Env file: `~/.content-publisher/.env`
- Signature file: `~/.content-publisher/signature.html`
- WeChat asset directory: `~/Desktop/wechat_assets/`
- Article archive: `~/Downloads/article-archive/all/`
- Image style history: `~/.openclaw-antigravity/workspace/images/style-history.txt`
- Layout style history: `~/.openclaw-antigravity/workspace/images/layout-style-history.txt`
- Trash cleanup target: `~/.Trash/`
- Chrome app path injected by setup script: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

## Known Limits

- This is not a one-click publishing app.
- The workflow still expects user confirmation at key checkpoints.
- Path assumptions reflect the author's own machine and workspace conventions.
- Publication credentials, IP whitelist, and signature setup are your responsibility.
- Final publication quality depends on another repo upstream: [content-alchemy](https://github.com/AliceLJY/content-alchemy).

## Features

| Feature | Description |
|---------|-------------|
| Image Generation | 56 illustration styles with auto-rotation, Gemini API, web-free, and CDP fallback |
| Layout Themes | 17 custom CSS themes with tone-matched rotation |
| WeChat Publishing | HTTP API publishing with credential and IP whitelist requirements |
| Signature Auto-Inject | Reads `~/.content-publisher/signature.html` before draft creation |
| Archive and Cleanup | Archives output and moves temp files to `~/.Trash/` |

## Setup

```bash
git clone https://github.com/AliceLJY/content-publisher.git
cd content-publisher
bun install
bash scripts/setup.sh
bash scripts/doctor.sh
```

What setup actually does:

- Installs Bun dependencies
- Appends a `chrome-debug` alias to `~/.zshrc` or `~/.bashrc`
- Creates `~/.content-publisher/.env` if missing
- Assumes the macOS Chrome app path used by the setup script

## Usage

### As a Claude Code Skill

```text
publish article.md
```

The skill handles image generation, layout selection, draft publishing, archiving, and cleanup with user checkpoints.

### Scripts

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

## Structure

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

## Ecosystem

| Repo | Role |
|------|------|
| [content-alchemy](https://github.com/AliceLJY/content-alchemy) | Upstream research and writing |
| **content-publisher** (this repo) | Images, layout, publishing, archive, cleanup |
| [openclaw-worker](https://github.com/AliceLJY/openclaw-worker) | Task API and Docker Compose for OpenClaw |
| [openclaw-cli-bridge](https://github.com/AliceLJY/openclaw-cli-bridge) | Three-way bridge for `/cc`, `/codex`, and `/gemini` |
| [digital-clone-skill](https://github.com/AliceLJY/digital-clone-skill) | Build digital clones from corpus data |
| [recallnest](https://github.com/AliceLJY/recallnest) | MCP-native memory workbench for AI conversations |
| [cc-shell](https://github.com/AliceLJY/cc-shell) | Lightweight Claude Code chat UI |
| [telegram-ai-bridge](https://github.com/AliceLJY/telegram-ai-bridge) | Telegram bots for Claude, Codex, and Gemini |
| [telegram-cli-bridge](https://github.com/AliceLJY/telegram-cli-bridge) | Telegram CLI bridge for the Gemini CLI path |

## Acknowledgments

This project was originally built on top of [baoyu-skills](https://github.com/JimLiu/baoyu-skills) by Jim Liu. The WeChat publishing pipeline, theme system, and markdown rendering approach were inspired by baoyu's work, while this repository now uses its own local scripts and workflow.

## Author

Built by **小试AI** ([@AliceLJY](https://github.com/AliceLJY)) for the WeChat public account **我的AI小木屋**.

Six content pillars: **Hands-on AI**, **AI Pitfall Diaries**, **AI and Humanity**, **AI Cold Eye**, **AI Musings**, and **AI Visual Notes**.

<img src="./assets/wechat_qr.jpg" width="200" alt="WeChat QR Code — 我的AI小木屋">

## License

MIT
