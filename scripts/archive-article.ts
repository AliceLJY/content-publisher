#!/usr/bin/env bun
/**
 * archive-article.ts - Copy article.md into Desktop/article-archive using article title as filename.
 *
 * Usage:
 *   bun scripts/archive-article.ts /path/to/article.md
 *   bun scripts/archive-article.ts /path/to/article.md --dest-dir /custom/archive/dir
 *   bun scripts/archive-article.ts /path/to/article.md --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface CliArgs {
  filePath: string;
  destDir: string;
  dryRun: boolean;
}

function printUsage(): never {
  console.log(`Archive article.md using frontmatter title as filename

Usage:
  bun scripts/archive-article.ts <article.md> [options]

Options:
  --dest-dir <dir>   Archive directory (default: ~/Desktop/article-archive)
  --dry-run          Show target path only
  --help             Show this help
`);
  process.exit(0);
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printUsage();
  }

  const args: CliArgs = {
    filePath: "",
    destDir: path.join(os.homedir(), "Downloads", "article-archive"),
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dest-dir" && argv[i + 1]) {
      args.destDir = argv[++i]!;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (!arg.startsWith("-") && !args.filePath) {
      args.filePath = arg;
    }
  }

  if (!args.filePath) {
    console.error("Error: article.md path required");
    process.exit(1);
  }

  return args;
}

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const eq = line.indexOf(":");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }

  return { meta, body: match[2]! };
}

function extractTitle(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(content);
  if (parsed.meta.title) return parsed.meta.title;

  const h1 = parsed.body.match(/^#\s+(.+)$/m);
  if (h1?.[1]) return h1[1].trim();

  throw new Error("No title found in frontmatter or H1");
}

function sanitizeFilename(title: string): string {
  return title
    .trim()
    .replace(/[\/\\]/g, "／")
    .replace(/:/g, "：")
    .replace(/\?/g, "？")
    .replace(/\*/g, "＊")
    .replace(/"/g, "”")
    .replace(/</g, "＜")
    .replace(/>/g, "＞")
    .replace(/\|/g, "｜")
    .replace(/\s+/g, " ");
}

function formatDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function findAvailableTarget(destDir: string, baseName: string): string {
  const dated = `${formatDate()}_${baseName}`;
  let candidate = path.join(destDir, `${dated}.md`);
  if (!fs.existsSync(candidate)) return candidate;

  let index = 2;
  while (true) {
    candidate = path.join(destDir, `${dated} ${index}.md`);
    if (!fs.existsSync(candidate)) return candidate;
    index++;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const title = extractTitle(filePath);
  const safeName = sanitizeFilename(title);
  const targetPath = findAvailableTarget(args.destDir, safeName);

  if (args.dryRun) {
    console.log(JSON.stringify({ title, targetPath }, null, 2));
    return;
  }

  fs.mkdirSync(args.destDir, { recursive: true });
  fs.copyFileSync(filePath, targetPath);

  // ── Append to digital clone corpus ──────────────────────────────────
  const corpusPath = path.join(
    os.homedir(),
    ".claude", "skills", "digital-clone", "clone-workspace", "refined", "articles-corpus.md"
  );
  let corpusAppended = false;
  if (fs.existsSync(corpusPath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseFrontmatter(content);
    // Append body only (no frontmatter, no signature)
    const body = parsed.body
      .replace(/<p[^>]*class="signature"[\s\S]*?<\/p>/gi, "")
      .trim();
    if (body) {
      fs.appendFileSync(corpusPath, `\n---\n\ntitle: ${title}\n\n${body}\n\n---\n`);
      corpusAppended = true;
    }
  }

  console.log(JSON.stringify({
    success: true,
    title,
    targetPath,
    corpusAppended,
  }, null, 2));
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
