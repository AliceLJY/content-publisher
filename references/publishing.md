# Publishing Reference

## API Mode vs Browser Mode

| | API Mode | Browser Mode |
|---|----------|-------------|
| **Command** | `publish-wechat.ts` | `wechat-article.ts` |
| **Requires Chrome** | No | Yes (port 9222) |
| **Requires Login** | No (uses app credentials) | Yes (WeChat backend session) |
| **Focus Stealing** | No | Yes (clipboard operations) |
| **Reliability** | High (pure HTTP) | Medium (DOM-dependent) |
| **Use When** | `WECHAT_APP_ID` configured | API not configured |

**Decision rule**: Check `~/.content-publisher/.env` or `~/.baoyu-skills/.env` for `WECHAT_APP_ID`. Present = API mode, absent = browser mode.

## API Mode

### Prerequisites

1. Create `~/.content-publisher/.env` (or `~/.baoyu-skills/.env` for backward compat):
   ```
   WECHAT_APP_ID=your_app_id
   WECHAT_APP_SECRET=your_app_secret
   ```
2. Add your machine's outbound IP to the WeChat Official Account platform IP whitelist (Settings > Development > Basic Configuration > IP Whitelist)

### Command

```bash
bun scripts/publish-wechat.ts <article.md> \
  --author "小试AI" \
  --cover <cover.png> \
  --theme <theme-key>
```

Options: `--theme`, `--cover`, `--author`, `--summary`, `--dry-run`. Uses our own `format-wechat.ts` for markdown→HTML (not baoyu's `md/render.ts`).

### IP Whitelist Error

Error `40164 invalid ip` means the requesting IP is not whitelisted. The error message contains the actual IP address — add it to the WeChat platform whitelist and retry.

## Browser Mode

### Prerequisites

1. Launch Chrome with debug port:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 \
     --user-data-dir="$HOME/chrome-debug-profile" &
   ```
   Note: Chrome 144+ requires a non-default `--user-data-dir` to bind the debug port.

2. Log in to WeChat Official Accounts Platform in the Chrome window.

### Command

```bash
bun ./dependencies/baoyu-skills/skills/baoyu-post-to-wechat/scripts/wechat-article.ts \
  --markdown <article.md> \
  --theme <theme-key>
```

### Caveats

- **Focus stealing**: Publishing uses clipboard operations that steal window focus. Do not switch windows during publish.
- **Multi-tab**: When publishing multiple articles, close the editor tab after each one to avoid focus errors.
- **Chrome debug port**: cdp.ts auto-detects existing debug ports and reuses them.

## Image Placeholder Format

The publishing scripts use `WECHATIMGPH_x` as internal image placeholders. These are generated automatically from `![alt](path)` markdown syntax by the preprocessing step.

**Never write raw `WECHATIMGPH_x` in article.md.** The baoyu script uses regex to find `![]()`patterns and replace them with numbered placeholders. If you write raw placeholders, the regex finds 0 images and all images are silently dropped.

## Post-Publish Checkpoint

After the script reports success:
1. Immediately inform the user and enter checkpoint
2. User confirms: title correct, cover image displays, content formatting looks right
3. Do not proceed with cleanup until user confirms

## Signature Template

The article signature is defined in:
```
~/.claude/projects/-Users-anxianjingya/memory/signature-template.html
```

Use a single `<p>` tag with `<br>` line breaks (not multiple `<p>` tags — WeChat adds excessive paragraph spacing). Style: `font-size: 12px; line-height: 1.6; color: #b2b2b2;`

Do not copy signatures from archived articles — they may use outdated formatting.
