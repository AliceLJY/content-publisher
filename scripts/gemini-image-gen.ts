#!/usr/bin/env bun
/**
 * Gemini 生图 - gemini-web-image (免费) / 官方 API / CDP 浏览器兜底
 *
 * Usage:
 *   bun gemini-image-gen.ts --prompt "A red apple" --output /path/to/image.png
 *   bun gemini-image-gen.ts --prompt "..." --output /path/to/image.png --method cdp
 *   bun gemini-image-gen.ts --prompt "..." --output /path/to/image.png --aspect 2.5:1
 *   bun gemini-image-gen.ts --prompt "..." --output /path/to/image.png --method web-free
 *
 * Fallback chain (auto): web-free -> api -> cdp
 * API key: reads GOOGLE_API_KEY from env or ~/.content-publisher/.env
 */
import fs from 'node:fs';
import path from 'node:path';
import { mkdir, writeFile, readFile, stat, readdir, rename } from 'node:fs/promises';

const args = {
  prompt: '',
  output: '',
  method: 'auto', // auto | web-free | api | cdp
  aspect: '',      // optional: "16:9", "2.5:1", "1:1" etc.
  slug: '',
  styleNumber: '',
  styleName: '',
  historyFile: '',
};

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--prompt' || process.argv[i] === '-p') args.prompt = process.argv[++i] || '';
  else if (process.argv[i] === '--output' || process.argv[i] === '-o') args.output = process.argv[++i] || '';
  else if (process.argv[i] === '--method') args.method = process.argv[++i] || 'auto';
  else if (process.argv[i] === '--aspect') args.aspect = process.argv[++i] || '';
  else if (process.argv[i] === '--slug') args.slug = process.argv[++i] || '';
  else if (process.argv[i] === '--style-number') args.styleNumber = process.argv[++i] || '';
  else if (process.argv[i] === '--style-name') args.styleName = process.argv[++i] || '';
  else if (process.argv[i] === '--history-file') args.historyFile = process.argv[++i] || '';
}

if (!args.prompt || !args.output) {
  console.error('Usage: bun gemini-image-gen.ts --prompt "A red apple" --output /path/to/image.png [--method auto|web-free|api|cdp] [--aspect 16:9]');
  process.exit(1);
}

await mkdir(path.dirname(args.output), { recursive: true });

function formatDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function inferSlug(outputPath: string): string {
  const parent = path.basename(path.dirname(outputPath));
  return parent && parent !== '.' ? parent : path.basename(outputPath, path.extname(outputPath));
}

function appendStyleHistory(): void {
  const slug = args.slug || inferSlug(args.output);
  const styleName = args.styleName.trim();
  if (!slug || !styleName) return;

  const styleNumber = args.styleNumber.trim();
  const historyPath = args.historyFile || path.join(process.env.HOME!, '.openclaw-antigravity', 'workspace', 'images', 'style-history.txt');
  const line = styleNumber
    ? `${formatDate()} ${slug} #${styleNumber.padStart(2, '0')} ${styleName}`
    : `${formatDate()} ${slug} ${styleName}`;
  const existing = fs.existsSync(historyPath) ? fs.readFileSync(historyPath, 'utf-8').split('\n').filter(Boolean) : [];
  const comments = existing.filter((entry) => entry.startsWith('#'));
  const entries = existing.filter((entry) => entry && !entry.startsWith('#'));
  if (entries.includes(line)) return;

  const nextContent = [
    ...(comments.length ? comments : [
      '# 风格轮换记录（最近20条，自动维护）',
      '# 格式：日期 slug #编号 风格名',
    ]),
    ...[...entries, line].slice(-20),
  ].join('\n') + '\n';

  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, nextContent, 'utf-8');
  console.log(`[HISTORY] Style recorded: ${line}`);
}

// Load API key from env or .env file
async function getApiKey(): Promise<string | null> {
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  try {
    const configDir = process.env.CONTENT_PUBLISHER_CONFIG_DIR || path.join(process.env.HOME!, '.content-publisher');
    const envPath = path.join(configDir, '.env');
    const content = await readFile(envPath, 'utf-8');
    const match = content.match(/^GOOGLE_API_KEY=(.+)$/m);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

// 方法 0: gemini-web-image（免费，走网页版 cookies）
async function tryWebFreeMethod(): Promise<boolean> {
  const webImageScript = process.env.GEMINI_WEB_IMAGE_SCRIPT || path.join(process.env.HOME!, 'gemini-web-image', 'gemini-web-image.ts');
  try {
    await stat(webImageScript);
  } catch {
    console.log('[WEB-FREE] gemini-web-image not installed');
    return false;
  }

  // Build prompt with optional aspect ratio hint
  let fullPrompt = args.prompt;
  if (args.aspect) {
    fullPrompt = `Generate an image with aspect ratio ${args.aspect}. ${fullPrompt}`;
  }

  console.log('[WEB-FREE] Generating image via gemini-web-image (free)...');

  try {
    const proc = Bun.spawn(
      ['bun', 'run', webImageScript, '--prompt', fullPrompt, '--output', args.output],
      { stdout: 'pipe', stderr: 'pipe' }
    );

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (exitCode === 0) {
      // Verify file exists and has content
      try {
        const fileStat = await stat(args.output);
        if (fileStat.size > 0) {
          console.log(`[WEB-FREE] Success: ${stdout.trim()}`);
          return true;
        }
      } catch {}
    }

    console.log(`[WEB-FREE] Failed (exit ${exitCode}): ${(stderr || stdout).trim().substring(0, 200)}`);
    return false;
  } catch (err: any) {
    console.error(`[WEB-FREE] Error: ${err.message}`);
    return false;
  }
}

// 方法 1: 官方 Gemini API 直连
async function tryApiMethod(): Promise<boolean> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.log('[API] No GOOGLE_API_KEY found');
    return false;
  }

  const model = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build prompt with optional aspect ratio hint
  let fullPrompt = args.prompt;
  if (args.aspect) {
    fullPrompt = `Generate an image with aspect ratio ${args.aspect}. ${fullPrompt}`;
  }

  console.log(`[API] Generating image with ${model}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      const hint = response.status === 403 ? ' (API key may be invalid)' :
                   response.status === 429 ? ' (quota exhausted, wait or check billing)' :
                   response.status === 400 ? ' (bad request, check prompt)' : '';
      const summary = error.length > 300
        ? error.substring(0, 300) + `... [${error.length} bytes total]`
        : error;
      console.error(`[API] HTTP ${response.status}${hint}: ${summary}`);
      return false;
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      console.error('[API] No content in response');
      return false;
    }

    // Find image part
    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        // Determine extension from mime type
        const ext = path.extname(args.output).toLowerCase();
        const mimeType = part.inlineData.mimeType || 'image/png';

        // If output expects png but got jpeg (or vice versa), still save with correct format
        await writeFile(args.output, buffer);
        console.log(`[API] Image generated: ${mimeType}, ${(buffer.length / 1024).toFixed(1)}KB`);
        return true;
      }
    }

    // Only got text, no image
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
    console.error(`[API] No image in response. Text: ${textParts.substring(0, 200)}`);
    return false;

  } catch (err: any) {
    console.error(`[API] Error: ${err.message}`);
    return false;
  }
}

// 方法 2: CDP 浏览器模式（兜底）
async function cdpMethod() {
  const cdpPath = path.join(import.meta.dir, 'cdp.ts');
  const { tryConnectExisting, findExistingChromeDebugPort, launchChrome, getPageSession, evaluate, typeText, sleep } = await import(cdpPath);

  // 优先连接已有的 Chromium (port 9222)，再 fallback 到自动发现
  let cdp = await tryConnectExisting(9222);
  let chrome = null;

  if (!cdp) {
    const port = await findExistingChromeDebugPort();
    cdp = port ? await tryConnectExisting(port) : null;
  }

  if (!cdp) {
    console.log('[CDP] No existing browser found, launching Chrome...');
    const result = await launchChrome('https://gemini.google.com/app');
    cdp = result.cdp;
    chrome = result.chrome;
    await sleep(5000);
  } else {
    console.log('[CDP] Connected to existing browser');
  }

  try {
    const session = await getPageSession(cdp, 'gemini.google.com');

    const existingImages = await session.cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('img')).map(img => img.src)`,
      returnByValue: true
    }, { sessionId: session.sessionId });

    const beforeUrls = new Set(existingImages.result.value || []);
    console.log(`[CDP] Found ${beforeUrls.size} existing images before generation`);

    console.log('[CDP] Entering prompt...');
    await session.cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('rich-textarea')?.focus()`
    }, { sessionId: session.sessionId });
    await sleep(500);

    await typeText(session, `Generate an image: ${args.prompt}`);
    await sleep(500);

    console.log('[CDP] Submitting...');
    await session.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13
    }, { sessionId: session.sessionId });
    await session.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13
    }, { sessionId: session.sessionId });

    console.log('[CDP] Waiting for image generation...');
    let imageUrl = null;

    for (let attempt = 0; attempt < 30; attempt++) {
      await sleep(1000);

      const result = await session.cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const existingUrls = ${JSON.stringify(Array.from(beforeUrls))};
            const imgs = Array.from(document.querySelectorAll('img'))
              .filter(img =>
                (img.src.startsWith('data:image') || img.src.includes('googleusercontent')) &&
                !existingUrls.includes(img.src) &&
                img.width > 100 && img.height > 100
              )
              .sort((a, b) => b.width * b.height - a.width * a.height);

            return imgs.length > 0 ? imgs[0].src : null;
          })()
        `,
        returnByValue: true
      }, { sessionId: session.sessionId });

      imageUrl = result.result.value;

      if (imageUrl) {
        console.log(`[CDP] Found new image after ${attempt + 1}s`);
        break;
      }

      if ((attempt + 1) % 5 === 0) {
        console.log(`[CDP] Still waiting... (${attempt + 1}s)`);
      }
    }

    if (!imageUrl) throw new Error('No generated image found after 30s');

    console.log(`[CDP] Image URL: ${imageUrl.substring(0, 80)}...`);

    console.log('[CDP] Hovering over image and clicking download button...');

    await session.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const existingUrls = ${JSON.stringify(Array.from(beforeUrls))};
          const imgs = Array.from(document.querySelectorAll('img'))
            .filter(img =>
              (img.src.startsWith('data:image') || img.src.includes('googleusercontent')) &&
              !existingUrls.includes(img.src) &&
              img.width > 100 && img.height > 100
            )
            .sort((a, b) => b.width * b.height - a.width * a.height);

          if (imgs.length === 0) return { success: false, error: 'No image found' };

          const img = imgs[0];
          const hoverEvent = new MouseEvent('mouseenter', { bubbles: true });
          img.dispatchEvent(hoverEvent);

          const parent = img.closest('[class*="response"], [class*="message"], div');
          if (!parent) return { success: false, error: 'Cannot find parent container' };

          setTimeout(() => {
            const buttons = Array.from(parent.querySelectorAll('button[aria-label*="下载"], button[aria-label*="Download"], button[download]'));
            if (buttons.length === 0) {
              const allButtons = Array.from(parent.querySelectorAll('button'));
              if (allButtons.length >= 3) {
                allButtons[allButtons.length - 1].click();
                return { success: true };
              }
            } else {
              buttons[0].click();
              return { success: true };
            }
          }, 500);

          return { success: true, pending: true };
        })()
      `,
      returnByValue: true
    }, { sessionId: session.sessionId });

    await sleep(2000);

    console.log('[CDP] Waiting for download to complete...');
    const downloadDir = process.env.DOWNLOAD_DIR || path.join(process.env.HOME!, 'Downloads');

    let downloadedFile = null;
    for (let i = 0; i < 10; i++) {
      await sleep(1000);

      const files = await readdir(downloadDir);
      const imageFiles = files.filter(f =>
        /\.(png|jpg|jpeg|webp)$/i.test(f) && !f.includes('.crdownload')
      );

      if (imageFiles.length > 0) {
        const stats = await Promise.all(
          imageFiles.map(async f => ({
            name: f,
            stat: await stat(path.join(downloadDir, f))
          }))
        );

        stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

        const now = Date.now();
        if (now - stats[0].stat.mtimeMs < 10000) {
          downloadedFile = path.join(downloadDir, stats[0].name);
          break;
        }
      }
    }

    if (!downloadedFile) {
      throw new Error('Download failed or timed out');
    }

    console.log(`[CDP] Download completed: ${downloadedFile}`);
    await rename(downloadedFile, args.output);

    return true;

  } finally {
    cdp.close();
    if (chrome) chrome.kill();
  }
}

// 执行
if (args.method === 'web-free') {
  const success = await tryWebFreeMethod();
  if (!success) {
    console.error('[WEB-FREE] Failed');
    process.exit(1);
  }
} else if (args.method === 'api') {
  const success = await tryApiMethod();
  if (!success) {
    console.error('[API] Failed');
    process.exit(1);
  }
} else if (args.method === 'cdp') {
  try {
    await cdpMethod();
  } catch (err: any) {
    console.error(`[CDP] Fatal: ${err.message}`);
    process.exit(1);
  }
} else {
  // auto: web-free (免费) -> 官方 API -> CDP
  console.log('[AUTO] Trying gemini-web-image (free)...');
  const webFreeSuccess = await tryWebFreeMethod();

  if (!webFreeSuccess) {
    console.log('[AUTO] Web-free failed, trying Gemini API...');
    const apiSuccess = await tryApiMethod();

    if (!apiSuccess) {
      console.log('[AUTO] API failed, switching to CDP method...');
      try {
        await cdpMethod();
      } catch (err: any) {
        console.error(`[CDP] Fatal: ${err.message}`);
        console.error('[AUTO] All 3 methods failed. Run doctor.sh to diagnose.');
        process.exit(1);
      }
    }
  }
}

const fileStat = await stat(args.output);
console.log(`Image saved: ${args.output} (${(fileStat.size / 1024).toFixed(1)}KB)`);
appendStyleHistory();
