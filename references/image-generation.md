# Image Generation Reference

## 56-Style Auto-Rotation

The system rotates through 56 illustration styles defined in `references/style-catalog.md`.

### Rotation Logic

1. Read `~/.openclaw-antigravity/workspace/images/style-history.txt` to find the last used style number
2. Next style = last number + 1 (wraps to 1 after 56)
3. Check tone match: compare the style's "Best For" column against article category/mood
4. If tone mismatch, skip to next style and re-check
5. Announce selected style to user (user can override)
6. After generation, append to history file

### History File Format

```
YYYY-MM-DD article-slug #NN style-name
```

Example:
```
2026-02-28 ai-agent-workflow #33 Van Gogh (梵高)
2026-03-01 wechat-publishing #34 Seurat Pointillism (修拉)
```

### Style Combinations

Two styles can be combined for unique effects. Format: `{Style A prompt suffix}, combined with {Style B prompt suffix}`. Max 2 styles per combo. See `references/style-catalog.md` for recommended combinations.

## Prompt Enhancement

Use nano-banana-pro to enhance image prompts before generation. This adds detail, mood, and compositional guidance to produce better results.

## Tool Priority

1. **gemini-image-gen.ts** (free, Gemini API):
   ```bash
   bun scripts/gemini-image-gen.ts --prompt "..." --output path.png --aspect 2.5:1
   ```
   Reads `GOOGLE_API_KEY` from env or `~/.content-publisher/.env`.

2. **Gemini API direct** (if script fails): Call `generativelanguage.googleapis.com` directly with `gemini-3-pro-image-preview` model.

3. **CDP browser fallback**:
   ```bash
   bun scripts/gemini-image-gen.ts --prompt "..." --output path.png --method cdp
   ```
   Requires Chrome with debug port. Script auto-connects to port 9222 or discovers existing Chrome.

### Gemini Pro vs Fast

- **Pro** (`gemini-3-pro-image-preview`): Renders Chinese text correctly. Use for all images.
- **Fast**: Cannot render Chinese characters reliably. Avoid for CJK content.

### CDP Download Method

Direct fetch of `googleusercontent.com` image URLs returns 403. The script:
1. Hovers over the generated image to reveal action buttons
2. Clicks the download button
3. Waits for the file to appear in `~/Downloads/`
4. Moves it to the specified output path

## Cover Image Requirements

WeChat Official Account covers must be landscape:
- **Preferred**: 2.5:1 aspect ratio (1024x410)
- **Acceptable**: 16:9 aspect ratio
- **Rejected**: Square (1:1) or portrait

Use `--aspect 2.5:1` with gemini-image-gen.ts. If the API ignores the aspect ratio request (Gemini web always returns 1024x1024), crop with:
```bash
sips --cropToHeightWidth 410 1024 cover.png
```

## Image Placement Rules

- **Cover**: Immediately after the title (first thing readers see)
- **Illustrations**: At section breaks / topic transitions
- **Never**: Pile all images at the end of the article

## Output Locations

Save generated images to:
1. `{topic-slug}/` working directory (for article.md references)
2. `~/Desktop/wechat_assets/` (backup / easy access)

## Image Placeholder Format

article.md must use standard Markdown image syntax: `![alt text](path/to/image.png)`

The publishing scripts internally convert these to `WECHATIMGPH_x` placeholders. Never write raw `WECHATIMGPH_x` in article.md — the regex won't match and images will be silently dropped.
