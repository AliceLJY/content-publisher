#!/usr/bin/env bun
/**
 * publish-wechat.ts - Publish article to WeChat Official Account via API
 *
 * Pure HTTP implementation (no Chrome needed). Uses format-wechat.ts
 * for markdown→HTML conversion.
 *
 * Usage:
 *   bun publish-wechat.ts <article.md> [options]
 *   bun publish-wechat.ts <article.html> [options]
 *
 * Options:
 *   --theme <name>     Layout theme for format-wechat.ts (default: wechat-default)
 *   --cover <path>     Cover image (local path or URL)
 *   --author <name>    Author name (max 16 chars)
 *   --summary <text>   Article digest (max 128 chars)
 *   --dry-run          Parse and render only, don't publish
 *   --help             Show this help
 *
 * Config: ~/.content-publisher/.env
 *   WECHAT_APP_ID=xxx
 *   WECHAT_APP_SECRET=xxx
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

// ── Types ────────────────────────────────────────────────────────────────────

interface WechatConfig {
  appId: string;
  appSecret: string;
}

interface AccessTokenResponse {
  access_token?: string;
  errcode?: number;
  errmsg?: string;
}

interface UploadResponse {
  media_id: string;
  url: string;
  errcode?: number;
  errmsg?: string;
}

interface DraftResponse {
  media_id?: string;
  errcode?: number;
  errmsg?: string;
}

interface CliArgs {
  filePath: string;
  isHtml: boolean;
  theme: string;
  cover?: string;
  author?: string;
  summary?: string;
  dryRun: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
const UPLOAD_URL = "https://api.weixin.qq.com/cgi-bin/material/add_material";
const DRAFT_URL = "https://api.weixin.qq.com/cgi-bin/draft/add";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);

// ── .env loader ──────────────────────────────────────────────────────────────

function loadEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function loadConfig(): WechatConfig {
  const env = loadEnvFile(path.join(os.homedir(), ".content-publisher", ".env"));

  const appId = process.env.WECHAT_APP_ID || env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET || env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "Missing WECHAT_APP_ID or WECHAT_APP_SECRET.\n" +
      "Create ~/.content-publisher/.env with:\n" +
      "  WECHAT_APP_ID=your_app_id\n" +
      "  WECHAT_APP_SECRET=your_app_secret"
    );
  }

  return { appId, appSecret };
}

// ── WeChat API ───────────────────────────────────────────────────────────────

async function fetchAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `${TOKEN_URL}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch access token: HTTP ${res.status}`);

  const data = (await res.json()) as AccessTokenResponse;
  if (data.errcode) {
    if (data.errcode === 40164) {
      throw new Error(
        `IP whitelist error (${data.errcode}): ${data.errmsg}\n` +
        "Add the IP shown above to WeChat platform: Settings > Development > Basic Config > IP Whitelist"
      );
    }
    throw new Error(`Access token error ${data.errcode}: ${data.errmsg}`);
  }
  if (!data.access_token) throw new Error("No access_token in response");
  return data.access_token;
}

async function uploadImage(
  imagePath: string,
  accessToken: string,
  baseDir?: string
): Promise<UploadResponse> {
  let fileBuffer: Buffer;
  let filename: string;
  let contentType: string;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    const resp = await fetch(imagePath);
    if (!resp.ok) throw new Error(`Failed to download image: ${imagePath}`);
    const buf = await resp.arrayBuffer();
    if (buf.byteLength === 0) throw new Error(`Remote image is empty: ${imagePath}`);
    fileBuffer = Buffer.from(buf);
    filename = path.basename(imagePath.split("?")[0]!) || "image.jpg";
    contentType = resp.headers.get("content-type") || "image/jpeg";
  } else {
    const resolved = path.isAbsolute(imagePath)
      ? imagePath
      : path.resolve(baseDir || process.cwd(), imagePath);
    if (!fs.existsSync(resolved)) throw new Error(`Image not found: ${resolved}`);
    const stats = fs.statSync(resolved);
    if (stats.size === 0) throw new Error(`Image is empty (0 bytes): ${resolved}`);
    fileBuffer = fs.readFileSync(resolved);
    filename = path.basename(resolved);
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
    };
    contentType = mimeMap[ext] || "image/jpeg";
  }

  const boundary = `----FormBoundary${Date.now().toString(16)}`;
  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    "utf-8"
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
  const body = Buffer.concat([header, fileBuffer, footer]);

  const url = `${UPLOAD_URL}?access_token=${accessToken}&type=image`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });

  const data = (await res.json()) as UploadResponse;
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`Upload failed (${data.errcode}): ${data.errmsg}`);
  }
  if (data.url?.startsWith("http://")) {
    data.url = data.url.replace(/^http:\/\//i, "https://");
  }
  return data;
}

async function uploadImagesInHtml(
  html: string,
  accessToken: string,
  baseDir: string
): Promise<{ html: string; firstMediaId: string }> {
  const imgRegex = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];
  if (matches.length === 0) return { html, firstMediaId: "" };

  let firstMediaId = "";
  let updated = html;

  for (const match of matches) {
    const [fullTag, src] = match;
    if (!src) continue;
    if (src.startsWith("https://mmbiz.qpic.cn")) {
      if (!firstMediaId) firstMediaId = src;
      continue;
    }

    const localMatch = fullTag.match(/data-local-path=["']([^"']+)["']/);
    const imgPath = localMatch ? localMatch[1]! : src;

    console.error(`[publish] Uploading image: ${imgPath}`);
    try {
      const resp = await uploadImage(imgPath, accessToken, baseDir);
      const newTag = fullTag
        .replace(/\ssrc=["'][^"']+["']/, ` src="${resp.url}"`)
        .replace(/\sdata-local-path=["'][^"']+["']/, "");
      updated = updated.replace(fullTag, newTag);
      if (!firstMediaId) firstMediaId = resp.media_id;
    } catch (err) {
      console.error(`[publish] Failed to upload ${imgPath}:`, err);
    }
  }

  return { html: updated, firstMediaId };
}

async function createDraft(
  accessToken: string,
  opts: { title: string; content: string; thumbMediaId: string; author?: string; digest?: string }
): Promise<DraftResponse> {
  const article: Record<string, unknown> = {
    article_type: "news",
    title: opts.title,
    content: opts.content,
    thumb_media_id: opts.thumbMediaId,
    need_open_comment: 1,
    only_fans_can_comment: 0,
  };
  if (opts.author) article.author = opts.author;
  if (opts.digest) article.digest = opts.digest;

  const res = await fetch(`${DRAFT_URL}?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articles: [article] }),
  });

  const data = (await res.json()) as DraftResponse;
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`Draft creation failed (${data.errcode}): ${data.errmsg}`);
  }
  return data;
}

// ── Markdown → HTML via format-wechat.ts ─────────────────────────────────────

function renderMarkdown(mdPath: string, theme: string): string {
  const formatScript = path.join(SCRIPT_DIR, "format-wechat.ts");
  const htmlPath = mdPath.replace(/\.md$/i, ".html");

  console.error(`[publish] Rendering markdown with theme: ${theme}`);
  const result = spawnSync("bun", [formatScript, "--input", mdPath, "--output", htmlPath, "--style", theme], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: path.dirname(mdPath),
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() || "";
    const stdout = result.stdout?.toString() || "";
    throw new Error(`format-wechat.ts failed:\n${stderr}\n${stdout}`);
  }

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML not generated: ${htmlPath}`);
  }

  console.error(`[publish] HTML generated: ${htmlPath}`);
  return htmlPath;
}

// ── HTML content extraction ──────────────────────────────────────────────────

function extractHtmlContent(htmlPath: string): string {
  const html = fs.readFileSync(htmlPath, "utf-8");
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1]!.trim() : html;
}

function extractHtmlTitle(html: string): string {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1]!;
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return h1Match ? h1Match[1]!.replace(/<[^>]+>/g, "").trim() : "";
}

// ── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const eq = line.indexOf(":");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body: match[2]! };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printUsage(): never {
  console.log(`Publish article to WeChat Official Account draft via API

Usage:
  bun publish-wechat.ts <file> [options]

Arguments:
  file                Markdown (.md) or HTML (.html) file

Options:
  --theme <name>      Layout theme for markdown rendering (default: wechat-default)
  --cover <path>      Cover image path (local file or URL)
  --author <name>     Author name (max 16 chars)
  --summary <text>    Article digest (max 128 chars)
  --dry-run           Parse and render only, don't publish
  --help              Show this help

Frontmatter Fields (markdown):
  title               Article title (required)
  author              Author name
  digest/summary/description   Article digest
  coverImage/cover/image       Cover image path

Config File (in priority order):
  1. Environment variables (WECHAT_APP_ID, WECHAT_APP_SECRET)
  2. ~/.content-publisher/.env

Examples:
  bun publish-wechat.ts article.md
  bun publish-wechat.ts article.md --theme wechat-anthropic --cover cover.png
  bun publish-wechat.ts article.md --author "小试AI" --summary "Brief intro"
  bun publish-wechat.ts styled.html --cover cover.png
  bun publish-wechat.ts article.md --dry-run
`);
  process.exit(0);
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printUsage();
  }

  const args: CliArgs = {
    filePath: "",
    isHtml: false,
    theme: "wechat-default",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--theme" && argv[i + 1]) {
      args.theme = argv[++i]!;
    } else if (arg === "--cover" && argv[i + 1]) {
      args.cover = argv[++i];
    } else if (arg === "--author" && argv[i + 1]) {
      args.author = argv[++i];
    } else if (arg === "--summary" && argv[i + 1]) {
      args.summary = argv[++i];
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (!arg.startsWith("-")) {
      args.filePath = arg;
    }
  }

  if (!args.filePath) {
    console.error("Error: File path required");
    process.exit(1);
  }

  args.isHtml = args.filePath.toLowerCase().endsWith(".html");
  return args;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.filePath);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const baseDir = path.dirname(filePath);
  let title = "";
  let author = args.author || "";
  let digest = args.summary || "";
  let htmlPath: string;
  let htmlContent: string;
  let meta: Record<string, string> = {};

  if (args.isHtml) {
    htmlPath = filePath;
    htmlContent = extractHtmlContent(htmlPath);
    const mdPath = filePath.replace(/\.html$/i, ".md");
    if (fs.existsSync(mdPath)) {
      const parsed = parseFrontmatter(fs.readFileSync(mdPath, "utf-8"));
      meta = parsed.meta;
    }
    title = meta.title || extractHtmlTitle(fs.readFileSync(htmlPath, "utf-8"));
    if (!author) author = meta.author || "";
    if (!digest) digest = meta.digest || meta.summary || meta.description || "";
    console.error(`[publish] Using HTML file: ${htmlPath}`);
  } else {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseFrontmatter(content);
    meta = parsed.meta;

    title = meta.title || "";
    if (!title) {
      const h1 = parsed.body.match(/^#\s+(.+)$/m);
      if (h1) title = h1[1]!;
    }
    if (!author) author = meta.author || "";
    if (!digest) digest = meta.digest || meta.summary || meta.description || "";

    htmlPath = renderMarkdown(filePath, args.theme);
    htmlContent = extractHtmlContent(htmlPath);
  }

  if (!title) {
    console.error("Error: No title found. Provide via frontmatter, --title in source, or <title> tag.");
    process.exit(1);
  }

  if (digest && digest.length > 120) {
    const truncated = digest.slice(0, 117);
    const lastPunct = Math.max(
      truncated.lastIndexOf("。"), truncated.lastIndexOf("，"),
      truncated.lastIndexOf("；"), truncated.lastIndexOf("、")
    );
    digest = lastPunct > 80 ? truncated.slice(0, lastPunct + 1) : truncated + "...";
  }

  console.error(`[publish] Title: ${title}`);
  if (author) console.error(`[publish] Author: ${author}`);
  if (digest) console.error(`[publish] Digest: ${digest.slice(0, 50)}...`);

  if (args.dryRun) {
    console.log(JSON.stringify({
      title,
      author: author || undefined,
      digest: digest || undefined,
      theme: args.theme,
      htmlPath,
      contentLength: htmlContent.length,
    }, null, 2));
    return;
  }

  // ── Authenticate ───────────────────────────────────────────────────────

  const config = loadConfig();
  console.error("[publish] Fetching access token...");
  const accessToken = await fetchAccessToken(config.appId, config.appSecret);

  // ── Upload images in HTML ──────────────────────────────────────────────

  console.error("[publish] Uploading images...");
  const { html: processedHtml, firstMediaId } = await uploadImagesInHtml(
    htmlContent, accessToken, baseDir
  );
  htmlContent = processedHtml;

  // ── Upload cover ───────────────────────────────────────────────────────

  let thumbMediaId = "";
  const rawCover = args.cover || meta.coverImage || meta.cover || meta.image;
  const coverPath = rawCover && !path.isAbsolute(rawCover) && args.cover
    ? path.resolve(process.cwd(), rawCover)
    : rawCover;

  if (coverPath) {
    console.error(`[publish] Uploading cover: ${coverPath}`);
    const resp = await uploadImage(coverPath, accessToken, baseDir);
    thumbMediaId = resp.media_id;
  } else if (firstMediaId) {
    if (firstMediaId.startsWith("https://")) {
      console.error(`[publish] Uploading first content image as cover`);
      const resp = await uploadImage(firstMediaId, accessToken, baseDir);
      thumbMediaId = resp.media_id;
    } else {
      thumbMediaId = firstMediaId;
    }
  }

  if (!thumbMediaId) {
    console.error("Error: No cover image. Provide via --cover, frontmatter coverImage, or include an image in content.");
    process.exit(1);
  }

  // ── Append signature ─────────────────────────────────────────────────

  const sigPath = path.join(os.homedir(), ".content-publisher", "signature.html");
  if (fs.existsSync(sigPath)) {
    const sig = fs.readFileSync(sigPath, "utf-8").trim();
    if (sig && !htmlContent.includes(sig.slice(0, 60))) {
      htmlContent += `\n${sig}`;
      console.error("[publish] Signature appended from ~/.content-publisher/signature.html");
    }
  }

  // ── Create draft ───────────────────────────────────────────────────────

  console.error("[publish] Creating draft...");
  const result = await createDraft(accessToken, {
    title,
    content: htmlContent,
    thumbMediaId,
    author: author || undefined,
    digest: digest || undefined,
  });

  console.log(JSON.stringify({
    success: true,
    media_id: result.media_id,
    title,
  }, null, 2));

  console.error(`[publish] Draft created! media_id: ${result.media_id}`);
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
