# Content Publisher

[English](README.md) | **简体中文**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

这是一个配图生成、排版格式化、微信公众号发布流水线。它接收写好的 `article.md`，输出带配图和样式的微信草稿。

## 测试环境

- 完整流程只在作者自己的 macOS 环境里实测过。
- 这个仓库的实际使用形态是 Claude Code skill 加 Bun 脚本工作流，不是独立桌面应用。
- macOS
- Claude Code CLI 工作流
- Bun
- 微信公众号 API 发布流程
- 作者机器上的本地素材目录和历史目录

## 兼容性说明

- 完整流程只在作者自己的 macOS 环境上验证过。
- 部分辅助脚本默认依赖 macOS 工具和路径。
- Windows 和 Linux 可能有部分功能能跑，但作者没有正式实测。
- `scripts/cdp.ts` 虽然包含 Windows 和 Linux 的 Chrome 路径候选，但这个仓库并不是按跨平台成品来文档化的。
- 微信发布还依赖你自己的公众号凭据和 IP 白名单。

## 前置条件

- Claude Code
- Bun
- 一份已经完成的 `article.md`
- 一个具备 API 能力的微信公众号
- 公众号出口 IP 白名单配置
- 本地 `~/.content-publisher/.env`
- 可选的 Chrome 远程调试端口，用于 CDP 兜底
- 如果想达到相同工作流质量，可选准备本地 persona、风格和归档目录

## 配置

创建 `~/.content-publisher/.env`：

```dotenv
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
GOOGLE_API_KEY=your_gemini_key
```

需要明确的配置前提：

- `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 会被 [`scripts/publish-wechat.ts`](scripts/publish-wechat.ts) 用于微信草稿发布。
- `GOOGLE_API_KEY` 会被 [`scripts/gemini-image-gen.ts`](scripts/gemini-image-gen.ts) 用于 Gemini API 生图。
- 必须把你机器的出口 IP 加入微信公众号平台白名单，否则草稿创建会失败。
- 如果需要自动追加签名档，需创建 `~/.content-publisher/signature.html`。
- Chrome `9222` 远程调试端口是可选项，但 CDP 兜底路径会用到。

## 本地假设

- 环境文件：`~/.content-publisher/.env`
- 签名文件：`~/.content-publisher/signature.html`
- 微信素材目录：`~/Desktop/wechat_assets/`
- 文章归档目录：`~/Desktop/article-archive/`（文件名使用文章标题）
- 配图风格历史：`~/.openclaw-antigravity/workspace/images/style-history.txt`
- 排版风格历史：`~/.openclaw-antigravity/workspace/images/layout-style-history.txt`
- 清理时移动到：`~/.Trash/`
- `setup.sh` 注入的 Chrome 路径：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

## 已知限制

- 这不是一键式发布应用。
- 工作流在关键检查点仍然需要用户确认。
- 路径假设反映的是作者自己的机器和工作区约定。
- 发布凭据、IP 白名单和签名档配置需要你自己负责。
- 最终发布质量还依赖上游仓库 [content-alchemy](https://github.com/AliceLJY/content-alchemy)。

## 功能

| 功能 | 说明 |
|------|------|
| 配图生成 | 56 种插图风格自动轮换，支持 Gemini API、web-free 和 CDP 兜底 |
| 排版主题 | 17 套自定义 CSS 主题，按文章气质轮换 |
| 微信发布 | 通过 HTTP API 发布，前提是凭据和 IP 白名单到位 |
| 签名自动注入 | 发草稿前读取 `~/.content-publisher/signature.html` |
| 归档与清理 | 归档输出，并把临时文件移到 `~/.Trash/` |

## 安装

```bash
git clone https://github.com/AliceLJY/content-publisher.git
cd content-publisher
bun install
bash scripts/setup.sh
bash scripts/doctor.sh
```

`setup` 实际会做这些事：

- 安装 Bun 依赖
- 向 `~/.zshrc` 或 `~/.bashrc` 追加 `chrome-debug` alias
- 如果缺失则创建 `~/.content-publisher/.env`
- 默认采用 `setup.sh` 里写死的 macOS Chrome 路径

## 用法

### 作为 Claude Code Skill

```text
publish article.md
```

这个 skill 会带着用户检查点处理配图、选排版、发草稿、归档和清理。

### 脚本

```bash
# 生成图片
bun scripts/gemini-image-gen.ts --prompt "..." --output cover.png --aspect 2.5:1

# 把 markdown 转成带样式 HTML
bun scripts/format-wechat.ts --input article.md --output styled.html --style wechat-default

# 发布到微信草稿
bun scripts/publish-wechat.ts article.md --author "Author" --cover cover.png --theme wechat-default

# 检查环境
bash scripts/doctor.sh
```

## 目录结构

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

## 生态位

| 仓库 | 角色 |
|------|------|
| [content-alchemy](https://github.com/AliceLJY/content-alchemy) | 上游调研与写作 |
| **content-publisher**（本仓库） | 配图、排版、发布、归档、清理 |
| [openclaw-worker](https://github.com/AliceLJY/openclaw-worker) | OpenClaw 的任务 API 和 Docker Compose |
| [openclaw-cli-bridge](https://github.com/AliceLJY/openclaw-cli-bridge) | `/cc`、`/codex`、`/gemini` 三路桥接 |
| [digital-clone-skill](https://github.com/AliceLJY/digital-clone-skill) | 从语料构建数字分身 |
| [local-memory](https://github.com/AliceLJY/local-memory) | 本地 AI 对话搜索 |
| [cc-shell](https://github.com/AliceLJY/cc-shell) | 轻量 Claude Code 聊天界面 |
| [telegram-ai-bridge](https://github.com/AliceLJY/telegram-ai-bridge) | Claude、Codex、Gemini 的 Telegram 机器人 |
| [telegram-cli-bridge](https://github.com/AliceLJY/telegram-cli-bridge) | 面向 Gemini CLI 路径的 Telegram CLI 桥 |

## 致谢

这个项目最初建立在 Jim Liu 的 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 之上。微信公众号发布流程、主题系统和 Markdown 渲染思路都受到了 baoyu 的启发，不过现在这个仓库已经使用自己的本地脚本和工作流。

## 作者

作者是 **小试AI** ([@AliceLJY](https://github.com/AliceLJY))，公众号为 **我的AI小木屋**。

六个内容方向：**AI 实操手账**、**AI 踩坑实录**、**AI 照见众生**、**AI 冷眼旁观**、**AI 胡思乱想**、**AI 视觉笔记**。

<img src="./assets/wechat_qr.jpg" width="200" alt="微信公众号二维码 — 我的AI小木屋">

## License

MIT
