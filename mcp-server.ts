#!/usr/bin/env bun
/**
 * Content Publisher MCP Server
 *
 * Exposes WeChat publishing tools via MCP so Claude Desktop (cowork)
 * can publish articles without direct filesystem access.
 *
 * Tools:
 *   - publish_article: Publish article.md to WeChat draft
 *   - list_themes: List available layout themes
 *   - next_theme: Show next theme in rotation
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SCRIPTS_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "scripts");
const LAYOUT_CATALOG = path.join(path.dirname(new URL(import.meta.url).pathname), "layout-style-catalog.md");
const LAYOUT_HISTORY = path.join(os.homedir(), ".openclaw-antigravity", "workspace", "images", "layout-style-history.txt");

const server = new McpServer({
  name: "content-publisher",
  version: "1.0.0",
});

// ── Tool: publish_article ────────────────────────────────────────────────────

server.tool(
  "publish_article",
  "Publish a finished article.md to WeChat Official Account as a draft. Handles markdown→HTML conversion, image upload, cover upload, signature injection, theme styling, and archiving.",
  {
    article_path: z.string().describe("Absolute path to article.md (e.g. ~/Desktop/articles/article.md)"),
    author: z.string().optional().default("小试AI").describe("Author name (default: 小试AI)"),
    cover: z.string().optional().describe("Cover image filename or path (default: cover.png in same directory)"),
    theme: z.string().optional().describe("Layout theme key (e.g. wechat-apple). If omitted, uses next in rotation"),
    dry_run: z.boolean().optional().default(false).describe("If true, only render HTML without publishing"),
  },
  async ({ article_path, author, cover, theme, dry_run }) => {
    try {
      // Resolve paths
      const articlePath = path.resolve(article_path);
      if (!fs.existsSync(articlePath)) {
        return { content: [{ type: "text" as const, text: `Error: File not found: ${articlePath}` }] };
      }

      const baseDir = path.dirname(articlePath);

      // Default cover: cover.png in same directory
      const coverPath = cover
        ? (path.isAbsolute(cover) ? cover : path.join(baseDir, cover))
        : path.join(baseDir, "cover.png");

      // Auto-select next theme if not specified
      const selectedTheme = theme || getNextTheme();

      // Build command
      const args = [
        path.join(SCRIPTS_DIR, "publish-wechat.ts"),
        articlePath,
        "--author", author || "小试AI",
        "--cover", coverPath,
        "--theme", selectedTheme,
      ];
      if (dry_run) args.push("--dry-run");

      const bunPath = process.execPath && path.basename(process.execPath).startsWith("bun")
        ? process.execPath
        : (process.env.BUN_PATH || 'bun');

      const result = spawnSync(bunPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: baseDir,
        timeout: 120_000,
      });

      const stdout = result.stdout?.toString() || "";
      const stderr = result.stderr?.toString() || "";

      if (result.status !== 0) {
        return {
          content: [{ type: "text" as const, text: `Publish failed (exit ${result.status}):\n${stderr}\n${stdout}` }],
        };
      }

      // Parse result
      let summary = `Published successfully!\n\nTheme: ${selectedTheme}\n`;
      try {
        const parsed = JSON.parse(stdout);
        summary += `Title: ${parsed.title}\nmedia_id: ${parsed.media_id}\n`;
      } catch {
        summary += stdout;
      }
      summary += `\nLogs:\n${stderr.split("\n").filter((l: string) => l.startsWith("[publish]")).join("\n")}`;

      return { content: [{ type: "text" as const, text: summary }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

// ── Tool: list_themes ────────────────────────────────────────────────────────

server.tool(
  "list_themes",
  "List all available layout themes for WeChat article formatting",
  {},
  async () => {
    try {
      const content = fs.readFileSync(LAYOUT_CATALOG, "utf-8");
      return { content: [{ type: "text" as const, text: content }] };
    } catch {
      return { content: [{ type: "text" as const, text: "Error: Could not read layout-style-catalog.md" }] };
    }
  }
);

// ── Tool: next_theme ─────────────────────────────────────────────────────────

server.tool(
  "next_theme",
  "Show the next theme in the rotation sequence based on history",
  {},
  async () => {
    const theme = getNextTheme();
    const catalog = readCatalog();
    const info = catalog[theme];
    const label = info ? `${info.number} ${info.label}` : theme;

    // Also show recent history
    let history = "";
    try {
      const lines = fs.readFileSync(LAYOUT_HISTORY, "utf-8").split("\n").filter(l => l && !l.startsWith("#"));
      history = "\n\nRecent history (last 5):\n" + lines.slice(-5).join("\n");
    } catch { /* ignore */ }

    return {
      content: [{ type: "text" as const, text: `Next theme: #${label} (key: ${theme})${history}` }],
    };
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function readCatalog(): Record<string, { number: string; label: string }> {
  if (!fs.existsSync(LAYOUT_CATALOG)) return {};
  const entries: Record<string, { number: string; label: string }> = {};
  for (const line of fs.readFileSync(LAYOUT_CATALOG, "utf-8").split("\n")) {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (!match) continue;
    const number = match[1]!.padStart(2, "0");
    const key = match[2]!.trim();
    const label = match[3]!.trim();
    if (key !== "#" && key !== "---") {
      entries[key] = { number, label };
    }
  }
  return entries;
}

function getNextTheme(): string {
  const catalog = readCatalog();
  const keys = Object.keys(catalog).filter(k => !["wechat-default", "ai-custom"].includes(k));
  if (keys.length === 0) return "wechat-default";

  // Read last used theme number from history
  let lastNumber = 0;
  try {
    const lines = fs.readFileSync(LAYOUT_HISTORY, "utf-8").split("\n").filter(l => l && !l.startsWith("#"));
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      const m = lastLine.match(/#(\d+)/);
      if (m) lastNumber = parseInt(m[1]!, 10);
    }
  } catch { /* no history */ }

  // Next number, wrap around (skip reserved: default=#01, ai-custom=#25)
  const maxNum = keys.length + 1; // account for skipped slots
  let nextNum = lastNumber + 1;
  if (nextNum > 25) nextNum = 2; // skip #01 (default)
  if (nextNum === 25) nextNum = 2; // skip #25 (ai-custom)

  // Find theme by number
  for (const [key, val] of Object.entries(catalog)) {
    if (parseInt(val.number, 10) === nextNum) return key;
  }

  return keys[0]!;
}

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
