# Publishing Reference

## API Mode

The primary (and currently only) publishing method. Pure HTTP, no Chrome needed.

### Prerequisites

1. Create `~/.content-publisher/.env`:
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

Options: `--theme`, `--cover`, `--author`, `--summary`, `--dry-run`. Uses `format-wechat.ts` for markdown→HTML conversion.

### IP Whitelist Error

Error `40164 invalid ip` means the requesting IP is not whitelisted. The error message contains the actual IP address — add it to the WeChat platform whitelist and retry.

## Browser Mode

**Status**: Not yet reimplemented. The previous browser mode relied on baoyu-skills (now removed). Use API mode instead.

If you need browser mode, run:
```bash
bash scripts/publish.sh article.md
```
It will display instructions to use API mode.

## Image Placeholder Format

article.md must use standard markdown `![alt](path)` syntax for images. The publish pipeline handles image upload and URL replacement automatically.

**Never write raw `WECHATIMGPH_x` in article.md.** These were internal placeholders used by the previous publishing system.

## Post-Publish Checkpoint

After the script reports success:
1. Immediately inform the user and enter checkpoint
2. User confirms: title correct, cover image displays, content formatting looks right
3. Do not proceed with cleanup until user confirms

## Signature Template

**Auto-injected**: `publish-wechat.ts` reads `~/.content-publisher/signature.html` and appends it to the HTML content before creating the WeChat draft. No manual action needed.

The signature file uses a single `<p>` tag with `<br>` line breaks (not multiple `<p>` tags — WeChat adds excessive paragraph spacing). Style: `font-size: 12px; line-height: 1.6; color: #b2b2b2;`

Source template also maintained at `~/.claude/projects/-Users-anxianjingya/memory/signature-template.html`. Keep both files in sync.

Do not copy signatures from archived articles — they may use outdated formatting.
