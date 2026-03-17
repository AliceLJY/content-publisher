<div align="center">

# Content Publisher

**面向 Claude Code 的微信公众号发布流水线**

*文章进去，微信草稿出来。配图生成、排版样式、签名注入，一条龙。*

一个 Claude Code Skill，接收写好的 `article.md`，输出带 AI 配图、自定义 CSS 主题和签名档的微信公众号草稿。

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://claude.com/claude-code)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f9f1e1?logo=bun)](https://bun.sh)
[![WeChat](https://img.shields.io/badge/WeChat-API-07C160?logo=wechat)](https://mp.weixin.qq.com)

[English](README.md) | **简体中文**

</div>

---

## 为什么需要 Content Publisher？

写完文章只是一半的事。你还得搞封面图、配插图、排版、发草稿——这些全做完才能发布。

### 没有 Content Publisher：

> 1. 开 Midjourney / DALL-E，生成封面，下载，裁成 2.5:1……
> 2. 生成 3-4 张段落插图，选风格，逐张下载……
> 3. 把文章复制到微信编辑器，和格式搏斗 20 分钟……
> 4. 逐张上传图片，插到对应位置……
> 5. 预览，调间距，再预览……
>
> **每篇文章 45-60 分钟的纯手工活。**😤

### 有了 Content Publisher：

> ```text
> publish article.md
> ```
>
> 封面 + 插图生成（56 种风格，自动轮换）→ 排版应用（17 套主题）→ 签名注入 → 微信草稿创建 → 归档 → 临时文件清理。✅
>
> **每个环节都有人工确认点。流水线处理剩下的事。**

---

## 能力一览

| 功能 | 说明 |
|------|------|
| **配图生成** | 56 种插图风格自动轮换，支持 Gemini API + web-free + CDP 兜底 |
| **排版主题** | 17 套自定义 CSS 主题，按文章气质轮换 |
| **微信发布** | 通过 HTTP API 创建草稿，需配置凭据和 IP 白名单 |
| **签名注入** | 发布前自动追加 `~/.content-publisher/signature.html` |
| **归档与清理** | 归档输出，临时文件移到 `~/.Trash/` |

---

## 快速开始

```bash
git clone https://github.com/AliceLJY/content-publisher.git
cd content-publisher
bun install
bash scripts/setup.sh
bash scripts/doctor.sh
```

### 配置

创建 `~/.content-publisher/.env`：

```dotenv
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
GOOGLE_API_KEY=your_gemini_key
```

> 必须把你机器的出口 IP 加入微信公众号平台白名单，否则草稿创建会报错 `40164`。

### 用法

**作为 Claude Code Skill：**

```text
publish article.md
```

**作为独立脚本：**

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

---

## 流水线

```
  content-alchemy（上游）                  content-publisher（本仓库）
  ─────────────────────                  ─────────────────────────

  Stage 1-5: 调研与写作          ───►    article.md
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   配图生成        │  56 种风格
                                     │（Gemini API/CDP）│  自动轮换
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   排版样式        │  17 套 CSS 主题
                                     │（format-wechat） │  按气质匹配
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  微信发布         │  API 草稿
                                     │  + 签名注入       │  + IP 白名单
                                     └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  归档 + 清理      │  ~/Desktop/article-archive/
                                     │                  │  临时文件 → ~/.Trash/
                                     └─────────────────┘
```

---

## 生态位

| 仓库 | 角色 |
|------|------|
| [content-alchemy](https://github.com/AliceLJY/content-alchemy) | 上游调研与写作（Stage 1-5） |
| **content-publisher**（本仓库） | 配图、排版、发布、归档、清理 |
| [recallnest](https://github.com/AliceLJY/recallnest) | 面向 Claude Code、Codex、Gemini CLI 的共享记忆层 |
| [openclaw-tunnel](https://github.com/AliceLJY/openclaw-tunnel) | Docker 到宿主机的隧道，支持 `/cc`、`/codex`、`/gemini` |
| [digital-clone-skill](https://github.com/AliceLJY/digital-clone-skill) | 从语料构建数字分身 |
| [cc-shell](https://github.com/AliceLJY/cc-shell) | 轻量 Claude Code 聊天界面 |
| [telegram-ai-bridge](https://github.com/AliceLJY/telegram-ai-bridge) | Claude、Codex、Gemini 的 Telegram 机器人 |
| [telegram-cli-bridge](https://github.com/AliceLJY/telegram-cli-bridge) | 面向 Gemini CLI 路径的 Telegram CLI 桥 |

---

<details>
<summary><strong>目录结构</strong></summary>

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
<summary><strong>前置条件与环境</strong></summary>

**必需：**
- Claude Code
- Bun
- 一份已经完成的 `article.md`
- 一个具备 API 能力的微信公众号
- 公众号出口 IP 白名单已配置

**配置文件：**
- 环境文件：`~/.content-publisher/.env`
- 签名文件：`~/.content-publisher/signature.html`（可选，自动追加）

**本地路径假设（可能需要调整）：**
- 微信素材目录：`~/Desktop/wechat_assets/`
- 文章归档目录：`~/Desktop/article-archive/`
- 配图风格历史：`~/.openclaw-antigravity/workspace/images/style-history.txt`
- 排版风格历史：`~/.openclaw-antigravity/workspace/images/layout-style-history.txt`
- 清理目标：`~/.Trash/`
- Chrome 路径：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

**兼容性：**
- 仅在作者本人的 macOS + Claude Code CLI 工作流中实测过
- 不保证在 Linux 或 Windows 上可用
- `scripts/cdp.ts` 包含 Windows/Linux Chrome 路径候选，但跨平台不是官方支持

</details>

---

## 致谢

最初建立在 Jim Liu 的 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 之上。微信发布流程、主题系统和 Markdown 渲染思路受到了 baoyu 的启发，现已使用独立的本地脚本和工作流。

## 作者

作者是 **小试AI**（[@AliceLJY](https://github.com/AliceLJY)），公众号为 **我的AI小木屋**。

六个内容方向：**AI 实操手账**、**AI 踩坑实录**、**AI 照见众生**、**AI 冷眼旁观**、**AI 胡思乱想**、**AI 视觉笔记**。

<img src="./assets/wechat_qr.jpg" width="200" alt="微信公众号二维码">

## 许可证

MIT
