# Content Publisher — Project Memory

## Overview

Image generation + layout formatting + WeChat publishing + cleanup pipeline. Takes a finished `article.md` (from content-alchemy or handwritten) and produces a WeChat Official Account draft.

## Key Pitfalls

### Image Generation
- **Cover aspect ratio**: Must be 2.5:1 or 16:9. WeChat rejects portrait/square covers. Use `--aspect 2.5:1` with gemini-image-gen.ts. Fallback: `sips --cropToHeightWidth 410 1024 cover.png`
- **Gemini Pro vs Fast**: Fast model cannot render Chinese text correctly. Always use Pro for images with Chinese characters
- **CDP download**: Direct fetch of googleusercontent URLs returns 403. Must simulate hover + click download button via CDP, then pick up file from ~/Downloads
- **Image placeholder format**: `WECHATIMGPH_x` is internal to baoyu scripts. article.md must use `![alt](path)` syntax — baoyu regex converts these automatically. Writing raw placeholders = 0 images inserted

### Layout and Publishing
- **Theme rotation**: 17 custom themes in `layout-style-catalog.md`. baoyu built-in default/grace/simple NOT in rotation. History at `~/.openclaw-antigravity/workspace/images/layout-style-history.txt`
- **API mode IP whitelist**: Error `40164 invalid ip` means the server's outbound IP needs to be added to WeChat platform whitelist. The error message contains the actual IP
- **Duplicate title**: If frontmatter has `title:`, do NOT add `# Title` in body — baoyu fills WeChat title from frontmatter but does not strip body H1. Both = duplicate title
- **Never call baoyu-post-to-wechat as a skill** — it lacks Content Publisher context

### Cleanup
- **Trash, not rm**: Move temp files to `~/.Trash/`, never `rm -rf`

## Environment

- **Runtime**: Bun (required for all .ts scripts)
- **OS**: macOS (sips, Chrome CDP)
- **Chrome**: 144+ (debug port requires non-default `--user-data-dir`)
- **baoyu-skills**: git submodule at `dependencies/baoyu-skills`

## Upstream

Article writing pipeline: [content-alchemy](https://github.com/AliceLJY/content-alchemy)
